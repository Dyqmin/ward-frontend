import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withLinkedState,
  withMethods,
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
  withEntities<DemoAlarm>(), // SS.7a
  withComputed(({ entities }) => ({
    // SS.7c
    openCount: computed(() => entities().filter((a) => !a.acknowledged).length),
  })),
  // SS.8
  withLinkedState(({ entities }) => ({
    selectedId: () => entities().find((a) => !a.acknowledged)?.id ?? null,
  })),
  withMethods((store) => ({
    // SS.7b
    acknowledge(id: string): void {
      patchState(store, updateEntity({ id, changes: { acknowledged: true } }));
    },
    // SS.8
    select(id: string): void {
      patchState(store, { selectedId: id });
    },
    /** Back to the demo alarms, after a slow "server". */
    async reload(): Promise<void> {
      await pause(500);
      patchState(store, setAllEntities([...DEMO_ALARMS])); // SS.7a
    },
  })),
  // SS.7a
  withHooks({
    onInit(store) {
      patchState(store, setAllEntities([...DEMO_ALARMS]));
    },
  }),
);
