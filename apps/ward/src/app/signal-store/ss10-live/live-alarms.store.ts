import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { firstValueFrom, pipe, switchMap, tap } from 'rxjs';

import {
  MessageBus,
  type AlarmEvent,
  type AlarmId,
  type Ward,
} from '@core/messaging/contract';
import { Toasts } from '@core/ui/toasts';

// SS.10–12 · LiveAlarmsStore. The steps are in live-alarms.ts.

// SS.10a
type LiveAlarmsState = {
  ward: Ward;
  alarms: AlarmEvent[];
  loading: boolean;
};

const initialState: LiveAlarmsState = {
  ward: 'ICU',
  alarms: [],
  loading: false,
};

export const LiveAlarmsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withProps(() => ({
    _bus: inject(MessageBus), // SS.10a
  })),
  withMethods((store) => ({
    // SS.10b
    async load(): Promise<void> {
      patchState(store, { loading: true });
      const alarms = await firstValueFrom(
        store._bus.request('/app/alarms.active', { ward: store.ward() }),
      );
      patchState(store, { alarms, loading: false });
    },
  })),

  withHooks({
    onInit(store) {
      void store.load(); // SS.10c
    },
  }),
);
