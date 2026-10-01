import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import type { BedId } from '@core/messaging/contract';

// SS.1 · MyBedsStore. The steps are in my-beds.ts.
