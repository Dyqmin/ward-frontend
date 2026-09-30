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
import { WardPickerActions } from '../s02-ward/ward.actions';
import { wardFeature } from '../s02-ward/ward.feature';
import { reasonOf, reconnects } from './alarm-helpers';
import {
  AlarmsApiActions,
  AlarmsTopicActions,
  BrokerActions,
  NurseStationActions,
} from './alarms.actions';

// S.5a, S.6d–g, S.7d–e, S.8 · the effects of the alarms board. The steps are in alarms-board.ts.

/**
 * S.5a · Refresh Clicked → one alarms.active request → Load Success or Load Failure.
 * S.8 · also after every reconnect, for the ward selected in the store.
 */
export const loadAlarms = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    bus = inject(MessageBus),
  ) =>
    actions$.pipe(
      ofType(NurseStationActions.refreshClicked, BrokerActions.reconnected),
      withLatestFrom(store.select(wardFeature.selectSelected)),
      exhaustMap(([, ward]) =>
        bus.request('/app/alarms.active', { ward }).pipe(
          map((alarms) => AlarmsApiActions.loadSuccess({ alarms })),
          catchError((error: Error) =>
            of(AlarmsApiActions.loadFailure({ error: error.message })),
          ),
          // S.6g · a reply for the old ward must not land in the new ward's list
          takeUntil(actions$.pipe(ofType(WardPickerActions.wardSelected))),
        ),
      ),
    ),
  { functional: true },
);

/**
 * S.6d–f · While the board is open: watch the topic of the selected ward (switchMap drops the
 * old ward), turn every broker event into an action, and stop when the board closes.
 */
export const liveAlarms = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    bus = inject(MessageBus),
  ) =>
    actions$.pipe(
      ofType(NurseStationActions.opened),
      switchMap(() =>
        store.select(wardFeature.selectSelected).pipe(
          switchMap((ward) => bus.watch(`/topic/alarms.${ward}`)),
          map((event) => AlarmsTopicActions.eventReceived({ event })),
          takeUntil(actions$.pipe(ofType(NurseStationActions.closed))),
        ),
      ),
    ),
  { functional: true },
);

/**
 * S.7d · Acknowledge Clicked → the alarms.ack command (retried safely: one commandId) → Ack
 * Accepted or Ack Rejected. The alarm's new status is NOT set here: it arrives as a topic event.
 */
export const acknowledgeAlarm = createEffect(
  (actions$ = inject(Actions), bus = inject(MessageBus)) =>
    actions$.pipe(
      ofType(NurseStationActions.acknowledgeClicked),
      mergeMap(({ alarmId }) =>
        bus.send('/app/alarms.ack', { alarmId }).pipe(
          commandRetry(bus),
          map((result) =>
            result.status === 'accepted'
              ? AlarmsApiActions.ackAccepted({ alarmId })
              : AlarmsApiActions.ackRejected({
                  alarmId,
                  reason: reasonOf(result),
                }),
          ),
          catchError(() =>
            of(
              AlarmsApiActions.ackRejected({
                alarmId,
                reason: 'Broker unreachable',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

/** S.7e · stretch: tell the nurse why. Emits no action (dispatch: false). */
export const showRejection = createEffect(
  (actions$ = inject(Actions), toasts = inject(Toasts)) =>
    actions$.pipe(
      ofType(AlarmsApiActions.ackRejected),
      tap(({ reason }) => toasts.show(reason, 'warn')),
    ),
  { functional: true, dispatch: false },
);

/** S.8 · the connection came back (reconnects() skips the first connect at start). */
export const brokerReconnected = createEffect(
  (reconnects$ = reconnects()) =>
    reconnects$.pipe(map(() => BrokerActions.reconnected())),
  { functional: true },
);
