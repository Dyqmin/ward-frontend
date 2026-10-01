import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { DEMO_ALARMS, type DemoAlarm } from '../signal-store-data';

// SS.2 · AlarmsStore. The steps are in alarms-page.ts.
