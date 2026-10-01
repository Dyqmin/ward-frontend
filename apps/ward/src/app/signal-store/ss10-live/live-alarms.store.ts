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
    _toasts: inject(Toasts), // SS.12a
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
    // SS.11a
    apply(event: AlarmEvent): void {
      patchState(store, (state) => ({
        alarms: state.alarms.some((a) => a.alarmId === event.alarmId)
          ? state.alarms.map((a) => (a.alarmId === event.alarmId ? event : a))
          : [...state.alarms, event],
      }));
    },
    // SS.12a
    async acknowledge(alarmId: AlarmId): Promise<void> {
      const result = await firstValueFrom(
        store._bus.send('/app/alarms.ack', { alarmId }),
      );
      if (result.status !== 'accepted') {
        store._toasts.show(`Not acknowledged: ${result.status}`, 'warn');
      }
    },
  })),
  // SS.11b · a second withMethods: it sees apply() from the block above
  withMethods((store) => ({
    follow: rxMethod<Ward>(
      pipe(
        switchMap((ward) => store._bus.watch(`/topic/alarms.${ward}`)),
        tap((event) => store.apply(event)),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      void store.load(); // SS.10c
      store.follow(store.ward); // SS.11c
    },
  }),
);
