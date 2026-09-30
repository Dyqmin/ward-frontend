import { createFeature, createReducer, on } from '@ngrx/store';

import type { AlarmEvent, AlarmId } from '@core/messaging/contract';
import { WardPickerActions } from '../s02-ward/ward.actions';
import { withEvent } from './alarm-helpers';
import {
  AlarmsApiActions,
  AlarmsTopicActions,
  NurseStationActions,
} from './alarms.actions';

// S.4b, S.6b, S.7b · the alarms state and its reducer. The steps are in alarms-board.ts.

export interface AlarmsState {
  alarms: AlarmEvent[];
  loading: boolean;
  error: string | null;
  /** Acknowledged here, no answer from the broker yet (S.7b). */
  pending: AlarmId[];
}

const initialState: AlarmsState = {
  alarms: [],
  loading: false,
  error: null,
  pending: [],
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
    // S.6b
    on(
      AlarmsTopicActions.eventReceived,
      (state, { event }): AlarmsState => ({
        ...state,
        alarms: withEvent(state.alarms, event),
      }),
    ),
    // S.7b
    on(
      NurseStationActions.acknowledgeClicked,
      (state, { alarmId }): AlarmsState => ({
        ...state,
        pending: [...state.pending, alarmId],
      }),
    ),
    on(
      AlarmsApiActions.ackAccepted,
      AlarmsApiActions.ackRejected,
      (state, { alarmId }): AlarmsState => ({
        ...state,
        pending: state.pending.filter((id) => id !== alarmId),
      }),
    ),
    on(
      WardPickerActions.wardSelected,
      (state): AlarmsState => ({
        ...state,
        alarms: [],
        error: null,
        loading: false,
      }),
    ),
  ),
});
