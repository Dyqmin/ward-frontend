import { createActionGroup, props } from '@ngrx/store';

import type { Ward } from '@core/messaging/contract';

// S.2a · the actions of the ward picker. The steps are in ward-picker.ts.
export const WardPickerActions = createActionGroup({
  source: 'Ward Picker',
  events: {
    'Ward Selected': props<{ ward: Ward }>(),
  },
});
