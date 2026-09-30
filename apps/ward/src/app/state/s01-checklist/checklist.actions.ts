import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type { BedId } from '@core/messaging/contract';

// S.1 · ready-made. The steps are in checklist.ts.
// One group per SOURCE: where the events happened. Each event becomes an action creator in
// camelCase: 'Bed Checked' → NightRoundActions.bedChecked({ bed }), whose type is
// "[Night Round] Bed Checked".
export const NightRoundActions = createActionGroup({
  source: 'Night Round',
  events: {
    'Bed Checked': props<{ bed: BedId }>(),
    'Round Reset': emptyProps(),
  },
});
