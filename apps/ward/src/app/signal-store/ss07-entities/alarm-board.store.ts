import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withLinkedState,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';

import { DEMO_ALARMS, pause, type DemoAlarm } from '../signal-store-data';

// SS.7–9 · AlarmBoardStore: ready-made with a plain array. You turn it into entities.
// The steps are in alarm-board.ts.

export const AlarmBoardStore = signalStore(
  { providedIn: 'root' },
  withState({ alarms: [...DEMO_ALARMS] as DemoAlarm[] }),
  withComputed(({ alarms }) => ({
    openCount: computed(() => alarms().filter((a) => !a.acknowledged).length),
  })),
  withMethods((store) => ({
    acknowledge(id: string): void {
      patchState(store, (state) => ({
        alarms: state.alarms.map((a) =>
          a.id === id ? { ...a, acknowledged: true } : a,
        ),
      }));
    },
    /** Back to the demo alarms, after a slow "server". */
    async reload(): Promise<void> {
      await pause(500);
      patchState(store, { alarms: [...DEMO_ALARMS] });
    },
  })),
);
