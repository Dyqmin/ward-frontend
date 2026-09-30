import { createFeature, createReducer, on } from '@ngrx/store';

import type { Ward } from '@core/messaging/contract';
import { WardPickerActions } from './ward.actions';

// S.2b · the ward state and its reducer (steps in ward-picker.ts).

export interface WardState {
  selected: Ward;
}

const initialState: WardState = { selected: 'ICU' };

export const wardFeature = createFeature({
  name: 'ward',
  reducer: createReducer(
    initialState,
    on(
      WardPickerActions.wardSelected,
      (state, { ward }): WardState => ({ ...state, selected: ward }),
    ),
  ),
});
