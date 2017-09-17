// @flow
import { select, call } from 'redux-saga/effects';
import * as Analytics from '../../services/Analytics';
import { currentUserSelector } from '../users/reducer';

export function* setAnalyticsUser(): Generator<*, *, *> {
  const user = yield select(currentUserSelector);
  yield call(Analytics.setUser, user);
}
