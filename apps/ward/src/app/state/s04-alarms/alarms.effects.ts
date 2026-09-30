import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  exhaustMap,
  map,
  mergeMap,
  of,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';

import { commandRetry } from '@core/messaging/command-retry';
import { MessageBus } from '@core/messaging/contract';
import { Toasts } from '@core/ui/toasts';
import { reasonOf, reconnects } from './alarm-helpers';
import { AlarmsApiActions, NurseStationActions } from './alarms.actions';

// S.5a, S.6d–g, S.7d–e, S.8 · the effects of the alarms board. The steps are in alarms-board.ts.

/** S.5a · Refresh Clicked → one alarms.active request → Load Success or Load Failure. */
export const loadAlarms = createEffect(
  (actions$ = inject(Actions), bus = inject(MessageBus)) =>
    actions$.pipe(
      ofType(NurseStationActions.refreshClicked),
      exhaustMap(({ ward }) =>
        bus.request('/app/alarms.active', { ward }).pipe(
          map((alarms) => AlarmsApiActions.loadSuccess({ alarms })),
          catchError((error: Error) =>
            of(AlarmsApiActions.loadFailure({ error: error.message })),
          ),
        ),
      ),
    ),
  { functional: true },
);
