import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type { AlarmEvent, AlarmId, Ward } from '@core/messaging/contract';

// S.4a, S.6a, S.7a, S.8 · the actions of the alarms board. The steps are in alarms-board.ts.

/** What the nurse did at the board. */
export const NurseStationActions = createActionGroup({
  source: 'Nurse Station',
  events: {
    'Refresh Clicked': props<{ ward: Ward }>(),
  },
});

/** What the broker answered to our requests. */
export const AlarmsApiActions = createActionGroup({
  source: 'Alarms API',
  events: {
    'Load Success': props<{ alarms: AlarmEvent[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
