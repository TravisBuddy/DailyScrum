// @flow
import type { ActionType } from './actions';
import type { StateType } from '../reducers';
import type { UserType } from 'DailyScrum/src/types';

const initialState: UsersStateType = {
  currentUser: null,
  list: {},
};

export default (state: UsersStateType = initialState, action: ActionType) => {
  const { list } = { ...state };

  switch (action.type) {
    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUser: action.payload.id,
      };

    case 'PUT_USERS_FROM_TRELLO':
      for (let user of action.payload.users) {
        list[user.id] = {
          ...(list[user.id]),
          ...user,
        };
      }
      return {
        ...state,
        list,
      };

    default:
      return state;
  }
};

export function usersSelector(state: StateType): UsersType {
  return state.users.list;
}

export function currentUserSelector(state: StateType): ?UserType {
  const users = usersSelector(state);
  if (state.users.currentUser) {
    return users[state.users.currentUser];
  }

  return null;
}

export type UsersStateType = {
  currentUser: ?string,
  list: UsersType,
};

export type UsersType = {
  [key: string]: UserType,
};
