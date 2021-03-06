// @flow
import { all, select, put, call, takeEvery, cancelled, cancel } from 'redux-saga/effects';
import { Trello } from '../../services';
import { putCards } from './';
import { tokenSelector } from '../auth/reducer';
import { sprintsSelector, currentSprintSelector, isCurrentSprintActiveSelector } from '../sprints/reducer';
import type { SprintType } from '../../types';
import { currentProjectSelector, validateColumnIdSelector } from '../projects/reducer';
import { getPoints } from '../../services/Trello';
import { getLastWorkableDayTime, BOUNDARY_HOUR, BOUNDARY_MINUTES } from '../../services/Time';
import { putSprints } from '../sprints/actions';
import { startSync, endSync } from '../sync';
import { configureTodayCardList, configureYesterdayCardList } from '../cardLists/sagas';
import { adaptCardsFromTrello } from '../../services/adapter';

export function* fetchDoneCards(): Generator<*, *, *> {
  try {
    yield put(startSync('cards', 'done'));
    const token = yield select(tokenSelector);
    const currentSprint: SprintType = yield select(currentSprintSelector);
    if (!currentSprint) yield cancel();
    const sprints = yield select(sprintsSelector);

    let doneColumnId = currentSprint.doneColumn;
    let cards = yield call(Trello.getCardsFromList, token.trello, doneColumnId);
    if (!cards.length) {
      // if it's the day after the ceremony, you still want to have the tickets of yesterday
      const lastSprint: any = Object.values(sprints).find(
        (sprint: SprintType) => sprint.number === currentSprint.number - 1
      );
      if (lastSprint) {
        doneColumnId = lastSprint.doneColumn;
        cards = yield call(Trello.getCardsFromList, token.trello, doneColumnId);
      }
    } else {
      // set the current done total to the current done performance
      const lastWorkableDayTime = getLastWorkableDayTime();
      let nextPerformanceIndex;
      if (lastWorkableDayTime < new Date(currentSprint.performance[0].date).getTime()) {
        nextPerformanceIndex = 0;
      } else {
        const currentPerformanceIndex = currentSprint.performance.findIndex(performance => {
          const currentDay = new Date(performance.date);
          currentDay.setHours(BOUNDARY_HOUR, BOUNDARY_MINUTES, 0, 0);
          return lastWorkableDayTime === currentDay.getTime();
        });

        if (currentPerformanceIndex !== -1) {
          nextPerformanceIndex = currentPerformanceIndex + 1;
        }
      }

      if (nextPerformanceIndex != null && currentSprint.performance[nextPerformanceIndex]) {
        const newSprint = { ...currentSprint };
        const total = cards.reduce((total, card) => total + getPoints(card.name), 0);
        newSprint.performance[nextPerformanceIndex].done = total;
        yield put(putSprints([newSprint]));
        // TODO REMOTE PUT to Scrumble
      }
    }

    const validateColumnId = yield select(validateColumnIdSelector);

    yield put(
      putCards({
        done: adaptCardsFromTrello(cards, validateColumnId, doneColumnId),
      })
    );
    yield call(configureYesterdayCardList);

    yield put(endSync('cards', 'done'));
  } catch (error) {
    console.info('[saga] fetchDoneCards', error);
    yield put(endSync('cards', 'done', error.message));
  } finally {
    if (yield cancelled()) {
      yield put(endSync('cards', 'done', 'cancelled'));
    }
  }
}

export function* fetchNotDoneCards(): Generator<*, *, *> {
  try {
    yield put(startSync('cards', 'notDone'));

    const isCurrentSprintActive = yield select(isCurrentSprintActiveSelector);
    const token = yield select(tokenSelector);
    const currentProject = yield select(currentProjectSelector);
    if (!currentProject || !currentProject.columnMapping) yield cancel();

    // fetch in parallel
    const cardsCalls = yield all(
      Object.values(currentProject.columnMapping).map(
        id =>
          // if it's not the active sprint, there's no cards that are not done
          !isCurrentSprintActive ? all([]) : call(Trello.getCardsFromList, token.trello, id)
      )
    );

    let cards = {};
    let i = 0;
    for (let key of Object.keys(currentProject.columnMapping)) {
      cards[key] = adaptCardsFromTrello(cardsCalls[i++]);
    }

    yield put(putCards(cards));
    yield call(configureTodayCardList);

    yield put(endSync('cards', 'notDone'));
  } catch (error) {
    console.info('[saga] fetchNotDoneCards', error);
    yield put(endSync('cards', 'notDone', error.message));
  } finally {
    if (yield cancelled()) {
      yield put(endSync('cards', 'notDone', 'cancelled'));
    }
  }
}

export function* fetchCards(): Generator<*, *, *> {
  yield all([call(fetchNotDoneCards), call(fetchDoneCards)]);
}

export default function*(): Generator<*, *, *> {
  yield* [
    takeEvery('FETCH_DONE_CARDS', fetchDoneCards),
    takeEvery('FETCH_NOT_DONE_CARDS', fetchNotDoneCards),
    takeEvery('FETCH_CARDS', fetchCards),
  ];
}
