import type { AlarmView } from '@wm/monitoring/data-access';
import {
  type AlarmCode,
  assertNever,
  type BedId,
  who,
} from '@wm/shared/domain';
import { clock } from '@wm/shared/util-dates';

/** Frames normally arrive every second; older than this and a card must say the data is stale. */
export const STALE_AFTER_SEC = 3;

export const ALARM_LABELS: Record<AlarmCode, string> = {
  'hr.high': 'HR high',
  'hr.low': 'HR low',
  'spo2.low': 'SpO₂ low',
  'rr.high': 'RR high',
  'rr.low': 'RR low',
};

export function alarmTitle(a: AlarmView): string {
  const label = a.code ? ALARM_LABELS[a.code] : 'Alarm';
  return a.value !== null ? `${label} (${a.value})` : label;
}

/** Every status handled, checked by the compiler. */
export function alarmStatus(a: AlarmView): string {
  const e = a.event;
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

export const isUrgent = (a: AlarmView): boolean =>
  a.event.status === 'raised' || a.event.status === 'escalated';

const NONE: readonly AlarmView[] = [];

/** Alarms grouped by bed, so each tile gets a stable array instead of a new one per change detection. */
export function alarmsByBed(
  alarms: readonly AlarmView[],
): (bed: BedId) => readonly AlarmView[] {
  const map = new Map<BedId, AlarmView[]>();
  for (const a of alarms)
    map.set(a.event.bed, [...(map.get(a.event.bed) ?? []), a]);
  return (bed) => map.get(bed) ?? NONE;
}
