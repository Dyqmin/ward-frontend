import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  mergeMap,
  of,
  skip,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';

import { commandRetry } from '@core/messaging/command-retry';
import { MessageBus } from '@core/messaging/contract';
import { Toasts } from '@core/ui/toasts';
import { reasonOf } from './alarm-helpers';

// S.5a, S.6d–f, S.7d–e, S.8 · the effects of the alarms board. The steps are in alarms-board.ts.
