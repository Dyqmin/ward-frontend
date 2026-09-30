import { createFeature, createReducer, on } from '@ngrx/store';

import type { AlarmEvent, AlarmId } from '@core/messaging/contract';
import { withEvent } from './alarm-helpers';
import { AlarmsApiActions, NurseStationActions } from './alarms.actions';

// S.4b, S.6b, S.7b · the alarms state and its reducer. The steps are in alarms-board.ts.

export interface AlarmsState {
  alarms: AlarmEvent[];
  loading: boolean;
  error: string | null;
}

const initialState: AlarmsState = {
  alarms: [],
  loading: false,
  error: null,
};

export const alarmsFeature = createFeature({
  name: 'alarms',
  reducer: createReducer(
    initialState,
    on(
      NurseStationActions.refreshClicked,
      (state): AlarmsState => ({ ...state, loading: true, error: null }),
    ),
    on(
      AlarmsApiActions.loadSuccess,
      (state, { alarms }): AlarmsState => ({
        ...state,
        alarms,
        loading: false,
        error: null,
      }),
    ),
    on(
      AlarmsApiActions.loadFailure,
      (state, { error }): AlarmsState => ({ ...state, error, loading: false }),
    ),
  ),
});
