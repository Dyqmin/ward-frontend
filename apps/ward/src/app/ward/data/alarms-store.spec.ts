import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { MessageBus, type AlarmEvent } from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { provideStomp, withMockBroker } from '@core/messaging/provide-stomp';
import { createWardFixtures, MockWard } from '../../testing/ward-fixtures';
import { AlarmsStore, reduceAlarms, type AlarmView } from './alarms-store';

const raised: AlarmEvent = { status: 'raised', alarmId: 'alarm_1', bed: 'ICU-3', code: 'hr.high', value: 140 };

describe('AlarmsStore', () => {
  it('lets the newest event per alarm win', () => {
    const acked: AlarmEvent = { status: 'acknowledged', alarmId: 'alarm_1', bed: 'ICU-3', by: 'nurse_ann', at: 'now' };
    const state = [raised, acked].reduce(reduceAlarms, new Map());
    expect([...state.values()]).toEqual([{ event: acked, code: 'hr.high', value: 140 }]);
  });

  describe('snapshot, then stream', () => {
    let ward: MockWard;
    let bus: FakeMessageBus;
    let seen: AlarmView[][];

    beforeEach(() => {
      vi.useFakeTimers();
      ward = new MockWard();
      ward.alarms.set('alarm_1', { alarmId: 'alarm_1', bed: 'ICU-3', code: 'hr.high', latest: raised, raisedAt: Date.now(), inRangeSince: null });
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideStomp({}, withMockBroker(createWardFixtures(ward)))],
      });
      bus = TestBed.inject(MessageBus) as FakeMessageBus;
      seen = [];
      TestBed.inject(AlarmsStore)
        .alarms$('ICU')
        .subscribe((a) => seen.push(a));
    });

    afterEach(() => vi.useRealTimers());

    it('starts from the alarms.active snapshot', async () => {
      await vi.advanceTimersByTimeAsync(300);
      expect(seen.at(-1)?.map((a) => a.event)).toEqual([raised]);
    });

    it('applies live events on top of the snapshot', async () => {
      await vi.advanceTimersByTimeAsync(300);
      const snoozed: AlarmEvent = { status: 'snoozed', alarmId: 'alarm_1', bed: 'ICU-3', by: 'nurse_bo', until: 'later' };
      bus.emit('/topic/alarms.ICU', snoozed);
      expect(seen.at(-1)).toEqual([{ event: snoozed, code: 'hr.high', value: 140 }]);
    });

    it('re-fetches the snapshot after a reconnect, dropping alarms that ended meanwhile', async () => {
      await vi.advanceTimersByTimeAsync(300);
      bus.simulateOutage(1_000);
      ward.alarms.clear(); // ended silently while we were offline
      await vi.advanceTimersByTimeAsync(1_000);
      TestBed.tick(); // let the connected signal reach toObservable
      await vi.advanceTimersByTimeAsync(300);
      expect(seen.at(-1)).toEqual([]);
    });
  });
});
