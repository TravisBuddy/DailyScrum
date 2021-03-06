// @flow
import type { ActionType } from './actions';
import type { StateType } from '../reducers';
import { devTeamSelector } from '../sprints/reducer';
import { getLastWorkableDayTime, getTodayWorkableDayTime } from '../../services/Time';
import { CardType, StoreCardType } from '../../types';
import type { CardListsKeyType } from '../cardLists/reducer';

export const initialState: CardsStateType = {
  list: {},
  yesterday: {
    done: [],
  },
  today: {
    blocked: [],
    doing: [],
    sprint: [],
    toValidate: [],
    done: [],
  },
  done: [],
  blocked: [],
  doing: [],
  sprint: [],
  toValidate: [],
  points: {
    yesterday: {
      done: 0,
    },
    today: {
      blocked: 0,
      doing: 0,
      sprint: 0,
      toValidate: 0,
      done: 0,
    },
    done: 0,
    blocked: 0,
    doing: 0,
    sprint: 0,
    toValidate: 0,
  },
};

const cardsArrayToPointsReducer = (total: number, card: CardType) => total + card.points;

export default (state: CardsStateType = initialState, action: ActionType) => {
  const { list: { ...list }, points: { ...points }, yesterday: { ...yesterday }, today: { ...today } } = { ...state };

  switch (action.type) {
    case 'PUT_CARDS':
      const lastWorkableDayTime = getLastWorkableDayTime();
      const todayWorkableDayTime = getTodayWorkableDayTime();
      const columns = action.payload.cards;
      const newPoints = { today: {}, yesterday: {} };
      for (let columnKey in columns) {
        const cards = columns[columnKey];
        cards.forEach(card => (list[card.id] = card));
        columns[columnKey] = cards.map(card => card.id);
        newPoints[columnKey] = cards.reduce(cardsArrayToPointsReducer, 0);

        // cards of today are those in sprint backlog / toValidate / doing / blocked that have points
        // in sprint backlog, only those assigned are shown
        if (['sprint', 'toValidate', 'doing', 'blocked'].indexOf(columnKey) !== -1) {
          const isSprint = columnKey === 'sprint';
          const todayCards = cards.filter(
            card => card.points !== null && ((isSprint && card.idMembers.length) || !isSprint)
          );
          today[columnKey] = todayCards.map(card => card.id);
          newPoints.today[columnKey] = todayCards.reduce(cardsArrayToPointsReducer, 0);
        } else if (columnKey === 'done') {
          // cards of yesterday are those in done
          // whose last activity was after the start of the last workable day
          // and before the start of this day
          // and that have points.
          // Last activity being last time somebody put the card in the column
          // or, if not available, the last "general" activity returned by Trello
          const yesterdayCards = cards.filter(card => {
            const lastActivityTime = new Date(card.dateLastActivity).getTime();
            return (
              lastActivityTime > lastWorkableDayTime && lastActivityTime <= todayWorkableDayTime && card.points !== null
            );
          });
          yesterday[columnKey] = yesterdayCards.map(card => card.id);
          newPoints.yesterday[columnKey] = yesterdayCards.reduce(cardsArrayToPointsReducer, 0);

          // cards that were done today
          const todayCards = cards.filter(card => {
            const lastActivityTime = new Date(card.dateLastActivity).getTime();
            return lastActivityTime > todayWorkableDayTime && card.points !== null;
          });
          today[columnKey] = todayCards.map(card => card.id);
          newPoints.today[columnKey] = todayCards.reduce(cardsArrayToPointsReducer, 0);
        } else {
          console.warn('[cardsReducer] column type not handled:', columnKey);
        }
      }

      return {
        ...state,
        list,
        ...columns,
        points: {
          ...points,
          ...newPoints,
          today: {
            ...points.today,
            ...newPoints.today,
          },
          yesterday: {
            ...points.yesterday,
            ...newPoints.yesterday,
          },
        },
        yesterday,
        today,
      };

    case 'CLEAR_CARDS':
      if (Object.keys(list).length <= 100) {
        return {
          ...initialState,
          list,
        };
      }
      return { ...initialState };

    case 'RESET_STORE':
      return initialState;

    default:
      return state;
  }
};

function formatCards(state: StateType, cards: StoreCardType[]): CardType[] {
  const team = devTeamSelector(state) || [];
  return cards.map(card => {
    const members = card.idMembers.map(id => team.find(member => member.id === id)).filter(Boolean);
    const idMembers = members.map(member => member.id); // filter dev/archi
    return {
      ...card,
      members,
      idMembers,
    };
  });
}

function dailyPointsSelector(state: StateType, time: CardListsKeyType, column?: ColumnType) {
  const dailyPoints = state.cards.points[time];
  if (!dailyPoints) return 0;

  if (column) {
    // $FlowFixMe
    return dailyPoints[column];
  }

  // $FlowFixMe
  return Object.values(dailyPoints).reduce((total: number, current: number) => total + current, 0);
}

export function yesterdayTotalSelector(state: StateType): number {
  return dailyPointsSelector(state, 'yesterday');
}

export function todayTotalSelector(state: StateType): number {
  return dailyPointsSelector(state, 'today');
}

function everyCardsSelector(state: StateType) {
  return state.cards.list;
}

function dailyCardsSelector(state: StateType, time: CardListsKeyType): CardListsType {
  const everyCards = everyCardsSelector(state);
  const dailyCards = state.cards[time];
  const lists = Object.keys(dailyCards);
  const cardLists = {};
  lists.sort(compareColumns).forEach(list => {
    // $FlowFixMe
    const cards = dailyCards[list].map(cardId => everyCards[cardId]);
    cardLists[list] = {
      points: dailyPointsSelector(state, time, list),
      list: formatCards(state, cards),
    };
  });
  return cardLists;
}

const compareColumns = (columnA: string, columnB: string): number => {
  const order = ['toValidate', 'doing', 'blocked', 'sprint', 'done'];
  return order.indexOf(columnA) - order.indexOf(columnB);
};

export function yesterdayCardsSelector(state: StateType): CardListsType {
  return dailyCardsSelector(state, 'yesterday');
}

export function todayCardsSelector(state: StateType): CardListsType {
  return dailyCardsSelector(state, 'today');
}

export type CardsStateType = {|
  list: { [id: string]: CardType },
  yesterday: {|
    done: string[],
  |},
  today: {|
    blocked: string[],
    doing: string[],
    sprint: string[],
    toValidate: string[],
    done: string[],
  |},
  done: string[],
  blocked: string[],
  doing: string[],
  sprint: string[],
  toValidate: string[],
  points: PointsStateType,
|};

export type CardListsType = {
  done?: CardListType,
  blocked?: CardListType,
  doing?: CardListType,
  sprint?: CardListType,
  toValidate?: CardListType,
};

export type CardListType = {
  points: number,
  list: CardType[],
};

type PointsStateType = {
  yesterday: {
    done: number,
  },
  today: {
    blocked: number,
    doing: number,
    sprint: number,
    toValidate: number,
  },
  done: number,
  blocked: number,
  doing: number,
  sprint: number,
  toValidate: number,
};

type ColumnType = 'done' | 'blocked' | 'doing' | 'sprint' | 'toValidate' | 'today' | 'yesterday';
