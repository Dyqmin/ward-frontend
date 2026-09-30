import { TestBed, type ComponentFixture } from '@angular/core/testing';

import type {
  AlarmEvent,
  CommandResult,
  MockContext,
  NurseId,
  WardRpcContract,
} from '@core/messaging/contract';
import { advance, ofType, setupState, text, type StateTest } from '../testing';
import AlarmsBoard from './alarms-board';

// DAY 4 · S.4–8. Run: pnpm nx test ward --include='**/alarms-board.spec.ts' --reporters=verbose
// S.8 is a stretch without a test.

const ICU_2: AlarmEvent = {
  status: 'raised',
  alarmId: 'alarm_icu2_hr',
  bed: 'ICU-2',
  code: 'hr.high',
  value: 140,
};
const ICU_3: AlarmEvent = {
  status: 'raised',
  alarmId: 'alarm_icu3_hr',
  bed: 'ICU-3',
  code: 'hr.high',
  value: 131,
};
const ER_1: AlarmEvent = {
  status: 'raised',
  alarmId: 'alarm_er1_spo2',
  bed: 'ER-1',
  code: 'spo2.low',
  value: 88,
};

type AckRequest = WardRpcContract['alarms.ack']['req'];
/** What the fake broker answers to alarms.ack; each S.7 test sets its own. */
let ackReply: (req: AckRequest, ctx: MockContext) => CommandResult = () => ({
  status: 'accepted',
  value: null,
});

let t: StateTest;
let fixture: ComponentFixture<AlarmsBoard>;
const el = () => fixture.nativeElement as HTMLElement;
const rows = () =>
  [...el().querySelectorAll('ul.alarms app-alarm-row')].map((r) => text(r));
const alarmsState = () =>
  t.slice<{
    alarms: AlarmEvent[];
    loading: boolean;
    error: string | null;
    pending?: string[];
  }>('alarms');
const click = async (selector: string) => {
  el().querySelector<HTMLButtonElement>(selector)?.click();
  await advance(fixture, 0);
};
const pickWard = async (label: string) => {
  [...el().querySelectorAll<HTMLButtonElement>('nav.wards button')]
    .find((b) => text(b) === label)
    ?.click();
  await advance(fixture, 0);
};
const emit = async (event: AlarmEvent, ward: 'ICU' | 'ER' = 'ICU') => {
  t.bus.emit(`/topic/alarms.${ward}`, event);
  await advance(fixture, 0);
};

beforeEach(async () => {
  t = await setupState({
    '/app/alarms.active': ({ ward }) =>
      ward === 'ICU' ? [ICU_2, ICU_3] : [ER_1],
    '/app/alarms.ack': (req, ctx) => ackReply(req, ctx),
  });
  fixture = TestBed.createComponent(AlarmsBoard);
  await advance(fixture, 0);
});

afterEach(() => vi.useRealTimers());

describe('S.4: state for a request', () => {
  it('Refresh dispatches "[Nurse Station] Refresh Clicked" with the selected ward, and the board is loading', async () => {
    await click('button.refresh');
    expect(ofType(t.actions, '[Nurse Station] Refresh Clicked')).toEqual([
      { type: '[Nurse Station] Refresh Clicked', ward: 'ICU' },
    ]);
    expect(alarmsState()?.loading).toBe(true);
    expect(text(el().querySelector('.loading'))).toBe('Loading alarms…');
  });

  it('"[Alarms API] Load Success" shows the alarms and ends the loading', async () => {
    await click('button.refresh');
    t.store.dispatch({ type: '[Alarms API] Load Success', alarms: [ICU_2] });
    await advance(fixture, 0);
    expect(alarmsState()?.loading).toBe(false);
    expect(el().querySelector('.loading')).toBeNull();
    expect(rows()).toEqual([expect.stringContaining('ICU-2 · HR high (140)')]);
  });

  it('"[Alarms API] Load Failure" shows the error and ends the loading', async () => {
    await click('button.refresh');
    t.store.dispatch({
      type: '[Alarms API] Load Failure',
      error: 'Broker down',
    });
    await advance(fixture, 0);
    expect(alarmsState()?.loading).toBe(false);
    expect(text(el().querySelector('.error'))).toBe('Broker down');
  });
});

describe('S.4b: a success clears an earlier error', () => {
  it('"[Alarms API] Load Success" after a failure removes the error', async () => {
    t.store.dispatch({
      type: '[Alarms API] Load Failure',
      error: 'Broker down',
    });
    t.store.dispatch({ type: '[Alarms API] Load Success', alarms: [ICU_2] });
    await advance(fixture, 0);
    expect(alarmsState()?.error).toBeNull();
    expect(el().querySelector('.error')).toBeNull();
  });
});

describe('S.5: an effect talks to the broker', () => {
  it('Refresh loads the active alarms of the selected ward', async () => {
    await click('button.refresh');
    await advance(fixture, 300);
    expect(ofType(t.actions, '[Alarms API] Load Success')).toHaveLength(1);
    expect(rows()).toHaveLength(2);
    expect(el().querySelector('.loading')).toBeNull();
  });

  it('an outage becomes "[Alarms API] Load Failure", and the next Refresh still works', async () => {
    t.bus.simulateOutage(1000);
    await click('button.refresh');
    expect(text(el().querySelector('.error'))).toBe(
      'Broker unreachable (simulated outage)',
    );
    await advance(fixture, 1000);
    await click('button.refresh');
    await advance(fixture, 300);
    expect(rows()).toHaveLength(2);
    expect(el().querySelector('.error')).toBeNull();
  });

  it('clicks while a request runs send no second request (exhaustMap)', async () => {
    await click('button.refresh');
    await click('button.refresh');
    await click('button.refresh');
    await advance(fixture, 300);
    const requests = t.bus
      .log()
      .filter((e) => e.destination === '/app/alarms.active');
    expect(requests).toHaveLength(1);
  });
});

describe('S.6: live data from the broker', () => {
  it('the board dispatches "[Nurse Station] Opened", and "Closed" when it goes away', () => {
    expect(ofType(t.actions, '[Nurse Station] Opened')).toHaveLength(1);
    fixture.destroy();
    expect(ofType(t.actions, '[Nurse Station] Closed')).toHaveLength(1);
  });

  it('an event on the ward topic becomes "[Alarms Topic] Event Received"; the newest event of an alarm wins', async () => {
    await emit(ICU_2);
    expect(ofType(t.actions, '[Alarms Topic] Event Received')).toEqual([
      { type: '[Alarms Topic] Event Received', event: ICU_2 },
    ]);
    expect(rows()).toEqual([expect.stringContaining('Raised')]);
    await emit({ ...ICU_2, status: 'escalated', to: 'doctor' } as AlarmEvent);
    expect(rows()).toEqual([expect.stringContaining('Escalated to doctor')]);
  });

  it('a new ward starts empty and follows the topic of that ward', async () => {
    await emit(ICU_2);
    await pickWard('ER');
    expect(rows()).toEqual([]);
    await emit(ICU_3, 'ICU');
    expect(rows()).toEqual([]);
    await emit(ER_1, 'ER');
    expect(rows()).toEqual([expect.stringContaining('ER-1')]);
  });

  it('after the board closes, the effect stops listening', async () => {
    fixture.destroy();
    const before = ofType(t.actions, '[Alarms Topic] Event Received').length;
    t.bus.emit('/topic/alarms.ICU', ICU_2);
    await vi.advanceTimersByTimeAsync(0);
    expect(ofType(t.actions, '[Alarms Topic] Event Received')).toHaveLength(
      before,
    );
  });
});

describe('S.6b: a new ward starts clean', () => {
  it('picking a ward clears the error and ends the loading', async () => {
    await click('button.refresh');
    t.store.dispatch({
      type: '[Alarms API] Load Failure',
      error: 'Broker down',
    });
    await pickWard('ER');
    expect(alarmsState()?.error).toBeNull();
    expect(alarmsState()?.loading).toBe(false);
  });
});

describe('S.6e–f: the live feed follows the board, not the effect', () => {
  it('a board opened again listens again', async () => {
    fixture.destroy();
    fixture = TestBed.createComponent(AlarmsBoard);
    await advance(fixture, 0);
    await emit(ICU_2);
    expect(rows()).toEqual([expect.stringContaining('ICU-2')]);
  });

  it('after the board closes, picking another ward does not start listening again', async () => {
    fixture.destroy();
    t.store.dispatch({ type: '[Ward Picker] Ward Selected', ward: 'ER' });
    const before = ofType(t.actions, '[Alarms Topic] Event Received').length;
    t.bus.emit('/topic/alarms.ER', ER_1);
    await vi.advanceTimersByTimeAsync(0);
    expect(ofType(t.actions, '[Alarms Topic] Event Received')).toHaveLength(
      before,
    );
  });
});

describe('S.6g: a late reply for the old ward', () => {
  it('is dropped when the ward changes while the request runs', async () => {
    await click('button.refresh');
    await pickWard('ER');
    await advance(fixture, 300);
    expect(ofType(t.actions, '[Alarms API] Load Success')).toEqual([]);
    expect(rows()).toEqual([]);
    expect(el().querySelector('.loading')).toBeNull();
    await click('button.refresh');
    await advance(fixture, 300);
    expect(rows()).toEqual([expect.stringContaining('ER-1')]);
  });
});

describe('S.7: a command, then an event', () => {
  it('Acknowledge dispatches "[Nurse Station] Acknowledge Clicked" and the alarm is pending', async () => {
    ackReply = () => ({ status: 'accepted', value: null });
    await emit(ICU_2);
    await click('button.ack');
    expect(ofType(t.actions, '[Nurse Station] Acknowledge Clicked')).toEqual([
      { type: '[Nurse Station] Acknowledge Clicked', alarmId: ICU_2.alarmId },
    ]);
    expect(alarmsState()?.pending).toEqual([ICU_2.alarmId]);
    expect(el().querySelector('.pending')).not.toBeNull();
  });

  it('accepted: pending ends, and the new status arrives as an event on the topic', async () => {
    ackReply = ({ alarmId, performedAt }, ctx) => {
      ctx.emit('/topic/alarms.ICU', {
        status: 'acknowledged',
        alarmId,
        bed: 'ICU-2',
        by: ctx.actor as NurseId,
        at: performedAt,
      });
      return { status: 'accepted', value: null };
    };
    await emit(ICU_2);
    await click('button.ack');
    await advance(fixture, 300);
    expect(ofType(t.actions, '[Alarms API] Ack Accepted')).toEqual([
      { type: '[Alarms API] Ack Accepted', alarmId: ICU_2.alarmId },
    ]);
    expect(alarmsState()?.pending).toEqual([]);
    expect(rows()).toEqual([expect.stringContaining('Acknowledged by')]);
  });

  it('refused: "[Alarms API] Ack Rejected" carries the reason, and pending ends', async () => {
    ackReply = () => ({
      status: 'conflict',
      by: 'nurse_bob_k2x9',
      at: '2026-10-01T10:31:00Z',
    });
    await emit(ICU_2);
    await click('button.ack');
    await advance(fixture, 300);
    const [rejected] = ofType(t.actions, '[Alarms API] Ack Rejected');
    expect(rejected?.['alarmId']).toBe(ICU_2.alarmId);
    expect(rejected?.['reason']).toMatch(/^Already handled by Bob at /);
    expect(alarmsState()?.pending).toEqual([]);
  });

  it('two alarms acknowledged at once are both handled (mergeMap)', async () => {
    ackReply = () => ({ status: 'accepted', value: null });
    await emit(ICU_2);
    await emit(ICU_3);
    for (const b of el().querySelectorAll<HTMLButtonElement>('button.ack'))
      b.click();
    await advance(fixture, 300);
    expect(
      ofType(t.actions, '[Alarms API] Ack Accepted').map((a) => a['alarmId']),
    ).toEqual([ICU_2.alarmId, ICU_3.alarmId]);
    expect(alarmsState()?.pending).toEqual([]);
  });

  it('a lost attempt is sent again (commandRetry)', async () => {
    let calls = 0;
    ackReply = () => {
      calls++;
      if (calls === 1) throw new Error('lost on the way');
      return { status: 'accepted', value: null };
    };
    await emit(ICU_2);
    await click('button.ack');
    await advance(fixture, 900);
    expect(calls).toBe(2);
    expect(ofType(t.actions, '[Alarms API] Ack Accepted')).toHaveLength(1);
    expect(ofType(t.actions, '[Alarms API] Ack Rejected')).toEqual([]);
  });
});
