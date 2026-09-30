import { ApplicationRef, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, filter, map, pairwise, skipWhile } from 'rxjs';

import {
  MessageBus,
  assertNever,
  type AlarmEvent,
  type CommandResult,
} from '@core/messaging/contract';
import { ALARM_LABELS, clock, who } from '../../ward/ui/format';

// Ready-made pure functions for S.4–8. You call them; you don't change them.

/**
 * The newest event of an alarm replaces its older event (same alarmId, same place in the list);
 * an alarm the list doesn't know yet goes to the end. Returns a NEW array, as a reducer must.
 */
export function withEvent(
  alarms: readonly AlarmEvent[],
  event: AlarmEvent,
): AlarmEvent[] {
  return alarms.some((a) => a.alarmId === event.alarmId)
    ? alarms.map((a) => (a.alarmId === event.alarmId ? event : a))
    : [...alarms, event];
}

/** Why the broker refused a command, in words a nurse can read. */
export function reasonOf(
  result: Exclude<CommandResult, { status: 'accepted' }>,
): string {
  switch (result.status) {
    case 'conflict':
      return `Already handled by ${who(result.by)} at ${clock(result.at)}`;
    case 'forbidden':
      return result.reason;
    default:
      return assertNever(result);
  }
}

/** Only a raised event carries the code and the value. */
export const alarmTitle = (e: AlarmEvent): string =>
  e.status === 'raised' ? `${ALARM_LABELS[e.code]} (${e.value})` : 'Alarm';

export function alarmStatus(e: AlarmEvent): string {
  switch (e.status) {
    case 'raised':
      return 'Raised';
    case 'escalated':
      return 'Escalated to doctor';
    case 'acknowledged':
      return `Acknowledged by ${who(e.by)} at ${clock(e.at)}`;
    case 'snoozed':
      return `Snoozed by ${who(e.by)} until ${clock(e.until)}`;
    default:
      return assertNever(e);
  }
}

/** A nurse can acknowledge what is still open. */
export const canAcknowledge = (e: AlarmEvent): boolean =>
  e.status === 'raised' || e.status === 'escalated';

/**
 * Emits once every time the connection to the broker comes BACK after a drop; the first connect
 * at start does not count. Call it in an injection context, e.g. as a parameter's default value.
 * It is tied to the app, not to the route that registers the effect, so it keeps working after
 * you leave /state and come back.
 */
export function reconnects(
  bus = inject(MessageBus),
  app = inject(ApplicationRef),
): Observable<void> {
  return toObservable(bus.connected, { injector: app.injector }).pipe(
    skipWhile((connected) => !connected), // wait for the first connect
    pairwise(),
    filter(([was, is]) => !was && is),
    map(() => undefined),
  );
}
