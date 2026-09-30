import { createFeature, createReducer, createSelector, on } from '@ngrx/store';

import { bedsOf, type Ward } from '@core/messaging/contract';

// S.2b · the ward state and its reducer (steps in ward-picker.ts).
// S.3b · a derived selector (steps in ../s03-selectors/ward-overview.ts).
