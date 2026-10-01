import { provideHttpClient } from '@angular/common/http';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { AuthStore } from '@core/auth/auth-store';
import { MessageBus, type AlarmEvent } from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { provideStomp, withMockBroker } from '@core/messaging/provide-stomp';
import { advance, text } from '../../streams/testing';
import { MockWard, createWardFixtures } from '../../testing/ward-fixtures';
import LiveAlarms from './live-alarms';

// DAY 4 · SS.10–12. Run: pnpm nx test ward --include='**/live-alarms.spec.ts' --reporters=verbose

const raised: AlarmEvent = {
  status: 'raised',
  alarmId: 'alarm_1',
  bed: 'ICU-3',
  code: 'hr.high',
  value: 140,
};

let ward: MockWard;
let bus: FakeMessageBus;
let fixture: ComponentFixture<LiveAlarms>;
let el: HTMLElement;
const rows = () => [...el.querySelectorAll('ul.alarms li.row')];
const row = (bed: string) =>
  rows().find((li) => text(li.querySelector('strong')) === bed);
const status = (bed: string) => text(row(bed)?.querySelector('.status'));

beforeEach(async () => {
  sessionStorage.clear();
  vi.useFakeTimers();
  ward = new MockWard();
  ward.alarms.set('alarm_1', {
    alarmId: 'alarm_1',
    bed: 'ICU-3',
    code: 'hr.high',
    latest: raised,
    raisedAt: Date.now(),
    inRangeSince: null,
  });
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideStomp({}, withMockBroker(createWardFixtures(ward))),
    ],
  });
  await TestBed.inject(AuthStore).join('Ann', 'nurse', 'ward-demo');
  bus = TestBed.inject(MessageBus) as FakeMessageBus;
  fixture = TestBed.createComponent(LiveAlarms);
  el = fixture.nativeElement as HTMLElement;
  await advance(fixture, 500);
});

afterEach(() => vi.useRealTimers());

describe('SS.10: load', () => {
  it('lists the active ICU alarm from alarms.active', () => {
    expect(status('ICU-3')).toBe('raised');
  });

  it('Reload asks the broker again', async () => {
    expect(status('ICU-3')).toBe('raised');
    ward.alarms.clear();
    el.querySelector<HTMLButtonElement>('button.reload')?.click();
    await advance(fixture, 500);
    expect(rows()).toHaveLength(0);
  });
});

describe('SS.11: live', () => {
  it('adds a new alarm from the ward topic', async () => {
    bus.emit('/topic/alarms.ICU', {
      ...raised,
      alarmId: 'alarm_2',
      bed: 'ICU-5',
    });
    await advance(fixture, 0);
    expect(status('ICU-5')).toBe('raised');
    expect(rows()).toHaveLength(2);
  });

  it('replaces an alarm when its next event arrives', async () => {
    bus.emit('/topic/alarms.ICU', {
      status: 'snoozed',
      alarmId: 'alarm_1',
      bed: 'ICU-3',
      by: 'nurse_bo',
      until: 'later',
    });
    await advance(fixture, 0);
    expect(rows()).toHaveLength(1);
    expect(status('ICU-3')).toBe('snoozed');
  });
});

describe('SS.12: acknowledge', () => {
  it('Acknowledge sends alarms.ack; the broadcast updates the row', async () => {
    row('ICU-3')?.querySelector<HTMLButtonElement>('button.ack')?.click();
    await advance(fixture, 500);
    expect(status('ICU-3')).toBe('acknowledged');
  });
});
