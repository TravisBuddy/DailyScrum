// @flow
import { call, put, select, takeEvery } from 'redux-saga/effects';
import Scrumble from 'DailyScrum/src/services/Scrumble';
import { putSprints, setCurrentSprint } from './actions';
import { tokenSelector } from '../auth/reducer';
import type { ScrumbleSprintType } from '../../types/Scrumble/Sprint';
import { currentProjectSelector } from '../projects/reducer';
import { startSync, endSync } from '../sync';

export function* fetchSprints(): Generator<*, *, *> {
  try {
    yield put(startSync('sprints', 'all'));
    const token = yield select(tokenSelector);
    const project = yield select(currentProjectSelector);
    const sprints: ScrumbleSprintType[] = yield call(Scrumble.getSprintsFromProject, token.scrumble, project.id);

    yield put(putSprints(sprints, true));

    const currentSprint = sprints.find(sprint => sprint.isActive);
    if (currentSprint) {
      yield put(setCurrentSprint(currentSprint));
    }
    yield put(endSync('sprints', 'all'));
  } catch (error) {
    console.warn('[saga] fetchSprints', error);
    yield put(endSync('sprints', 'all', error.message)); // TODO show modal with error
  }
}

function* fetchCurrentSprint() {
  try {
    yield put(startSync('sprints', 'current'));
    const token = yield select(tokenSelector);
    const sprint: ScrumbleSprintType = yield call(Scrumble.getCurrentSprint, token.scrumble);
    yield put(putSprints([sprint], true));
    yield put(setCurrentSprint(sprint));
    yield put(endSync('sprints', 'current'));
  } catch (error) {
    console.warn('[saga] fetchCurrentSprint', error);
    yield put(endSync('sprints', 'current', error.message)); // TODO show modal with error
  }
}

export default function*(): Generator<*, *, *> {
  yield* [takeEvery('FETCH_CURRENT_SPRINT', fetchCurrentSprint), takeEvery('FETCH_SPRINTS', fetchSprints)];
}
