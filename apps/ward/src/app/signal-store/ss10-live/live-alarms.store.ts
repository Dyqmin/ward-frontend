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
