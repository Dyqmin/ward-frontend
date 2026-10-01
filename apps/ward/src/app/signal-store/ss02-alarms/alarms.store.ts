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

// SS.2a
type AlarmsState = {
  alarms: DemoAlarm[];
  onlyHigh: boolean;
};

const initialState: AlarmsState = {
  alarms: [...DEMO_ALARMS],
  onlyHigh: false,
};

export const AlarmsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ alarms, onlyHigh }) => ({
    // SS.2c
    openCount: computed(() => alarms().filter((a) => !a.acknowledged).length),
    // SS.2e
    highCount: computed(
      () =>
        alarms().filter((a) => !a.acknowledged && a.severity === 'high').length,
    ),
    visibleAlarms: computed(() =>
      onlyHigh() ? alarms().filter((a) => a.severity === 'high') : alarms(),
    ),
  })),
  withMethods((store) => ({
    // SS.2d
    acknowledge(id: string): void {
      patchState(store, (state) => ({
        alarms: state.alarms.map((a) =>
          a.id === id ? { ...a, acknowledged: true } : a,
        ),
      }));
    },
    // SS.2e
    toggleOnlyHigh(): void {
      patchState(store, (state) => ({ onlyHigh: !state.onlyHigh }));
    },
  })),
);
