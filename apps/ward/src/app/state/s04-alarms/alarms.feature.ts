import { createFeature, createReducer, on } from '@ngrx/store';

import type { AlarmEvent, AlarmId } from '@core/messaging/contract';
import { withEvent } from './alarm-helpers';

// S.4b, S.6b, S.7b · the alarms state and its reducer. The steps are in alarms-board.ts.
