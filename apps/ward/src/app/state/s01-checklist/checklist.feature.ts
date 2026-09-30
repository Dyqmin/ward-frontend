import { createFeature, createReducer, on } from '@ngrx/store';

import type { BedId } from '@core/messaging/contract';
import { NightRoundActions } from './checklist.actions';

// S.1 · ready-made, except the one rule you change in S.1c. The steps are in checklist.ts.

export interface ChecklistState {
  /** The beds already checked on this round, in the order they were checked. */
  checked: BedId[];
}

const initialState: ChecklistState = { checked: [] };

// createFeature: the reducer under a name ('checklist' is its key in the state), plus one
// selector per field (checklistFeature.selectChecked).
export const checklistFeature = createFeature({
  name: 'checklist',
  // The reducer: (current state, action) → next state. Pure: no services, no timers, and it
  // never changes the old state; every handler returns a new object.
  reducer: createReducer(
    initialState,
    on(
      NightRoundActions.bedChecked,
      (state, { bed }): ChecklistState =>
        state.checked.includes(bed)
          ? state // S.1c · change this case
          : { ...state, checked: [...state.checked, bed] },
    ),
    on(NightRoundActions.roundReset, (): ChecklistState => initialState),
  ),
});
