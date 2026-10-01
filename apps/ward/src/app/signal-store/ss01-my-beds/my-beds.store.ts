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

export const MyBedsStore = signalStore(
  { providedIn: 'root' },
  withState({ beds: [] as BedId[] }), // SS.1a
  withComputed(({ beds }) => ({
    count: computed(() => beds().length), // SS.1d
  })),
  withMethods((store) => ({
    // SS.1c
    toggle(bed: BedId): void {
      const beds = store.beds();
      patchState(store, {
        beds: beds.includes(bed)
          ? beds.filter((b) => b !== bed)
          : [...beds, bed],
      });
    },
  })),
);
