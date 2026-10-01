import type { AlarmEvent } from '@wm/shared/domain';

import { reduceAlarms } from './alarm-view';

const raised: AlarmEvent = {
  status: 'raised',
  alarmId: 'alarm_1',
  bed: 'ICU-3',
  code: 'hr.high',
  value: 140,
};

// plain TypeScript: no TestBed, no providers
describe('reduceAlarms', () => {
  it('lets the newest event per alarm win', () => {
    const acked: AlarmEvent = {
      status: 'acknowledged',
      alarmId: 'alarm_1',
      bed: 'ICU-3',
      by: 'nurse_ann',
      at: 'now',
    };
    const state = [raised, acked].reduce(reduceAlarms, new Map());
    expect([...state.values()]).toEqual([
      { event: acked, code: 'hr.high', value: 140 },
    ]);
  });
});
