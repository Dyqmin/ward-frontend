import type { AlarmCode, AlarmEvent, AlarmId } from '@wm/shared/domain';

/** The latest event of an alarm, plus what only its `raised` event carried. */
export interface AlarmView {
  event: AlarmEvent;
  code: AlarmCode | null;
  value: number | null;
}

export type AlarmState = ReadonlyMap<AlarmId, AlarmView>;

/** The newest event per alarmId wins; code and value survive from the last `raised` event. */
export function reduceAlarms(state: AlarmState, e: AlarmEvent): AlarmState {
  const prev = state.get(e.alarmId);
  const next = new Map(state);
  next.set(
    e.alarmId,
    e.status === 'raised'
      ? { event: e, code: e.code, value: e.value }
      : { event: e, code: prev?.code ?? null, value: prev?.value ?? null },
  );
  return next;
}
