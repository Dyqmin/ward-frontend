import { createSelector } from '@ngrx/store';

import { wardOf } from '@core/messaging/contract';
import { checklistFeature } from '../s01-checklist/checklist.feature';
import { wardFeature } from '../s02-ward/ward.feature';

// S.3b · a selector that combines two features. The steps are in ward-overview.ts.

/** The beds checked on the night round that belong to the selected ward. */
export const selectCheckedInSelectedWard = createSelector(
  wardFeature.selectSelected,
  checklistFeature.selectChecked,
  (ward, checked) => checked.filter((bed) => wardOf(bed) === ward),
);
