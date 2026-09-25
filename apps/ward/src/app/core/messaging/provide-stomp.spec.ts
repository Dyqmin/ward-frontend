import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, retry, take, toArray } from 'rxjs';

import { AuthStore } from '../auth/auth-store';
import { MessageBus } from './contract';
import { FakeMessageBus } from './fake-message-bus';
import { provideStomp, withMockBroker } from './provide-stomp';
import { createWardFixtures, MockWard } from '../../testing/ward-fixtures';

describe('provideStomp(…, withMockBroker())', () => {
  let ward: MockWard;
  let bus: FakeMessageBus;

  beforeEach(async () => {
    sessionStorage.clear();
    vi.useFakeTimers();
    ward = new MockWard();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideStomp(
          { brokerURL: 'ws://unused/rooms/{room}/ws' },
          withMockBroker(createWardFixtures(ward)),
        ),
      ],
    });
    await TestBed.inject(AuthStore).join('Ann', 'nurse', 'ward-demo');
    bus = TestBed.inject(MessageBus) as FakeMessageBus;
  });

  afterEach(() => vi.useRealTimers());

  it('gives the app the fake broker, typed by the contract', async () => {
    expect(bus).toBeInstanceOf(FakeMessageBus);
    const reply = firstValueFrom(
      bus.request('/app/patients.get', { bed: 'ICU-3' }),
    );
    await vi.advanceTimersByTimeAsync(300);
    expect((await reply)?.bed).toBe('ICU-3');
  });

  it('streams vitals once per second while connected', async () => {
    const frames = firstValueFrom(
      bus.watch('/topic/vitals.ICU-1').pipe(take(3), toArray()),
    );
    await vi.advanceTimersByTimeAsync(3_000);
    expect((await frames).map((f) => f.bed)).toEqual([
      'ICU-1',
      'ICU-1',
      'ICU-1',
    ]);
  });

  it('never gives a second dose: a repeated commandId returns the stored result', async () => {
    const orderId = [...ward.orders.keys()][0];
    if (!orderId) throw new Error('fixture has no orders');
    const given$ = bus.send('/app/medication.given', { id: orderId }); // one commandId for this action

    const first = firstValueFrom(given$);
    await vi.advanceTimersByTimeAsync(300);
    const second = firstValueFrom(given$); // e.g. a retry after a lost reply
    await vi.advanceTimersByTimeAsync(300);

    expect(await first).toEqual({ status: 'accepted', value: null });
    expect(await second).toEqual({ status: 'accepted', value: null }); // not a conflict with itself
    expect(bus.log().map((e) => e.outcome)).toEqual(['handled', 'duplicate']);
    expect(new Set(bus.log().map((e) => e.commandId)).size).toBe(1);
  });

  it('retries through an outage with the same commandId', async () => {
    const orderId = [...ward.orders.keys()][1];
    if (!orderId) throw new Error('fixture has no orders');
    bus.simulateOutage(2_000);
    expect(bus.connected()).toBe(false);

    const result = firstValueFrom(
      bus
        .send('/app/medication.given', { id: orderId })
        .pipe(retry({ count: 5, delay: 800 })),
    );
    await vi.advanceTimersByTimeAsync(4_000);

    expect(await result).toEqual({ status: 'accepted', value: null });
    const attempts = bus.log();
    expect(
      attempts.filter((e) => e.outcome === 'offline').length,
    ).toBeGreaterThanOrEqual(2);
    expect(attempts.filter((e) => e.outcome === 'handled')).toHaveLength(1);
    expect(new Set(attempts.map((e) => e.commandId)).size).toBe(1);
  });

  it('lets the fixture refuse commands from the wrong role', async () => {
    const reply = firstValueFrom(
      bus.send('/app/medication.order', {
        patientId: 'pat_icu1',
        drug: 'Paracetamol',
        doseMg: 500,
        route: 'oral',
      }),
    );
    await vi.advanceTimersByTimeAsync(300);
    expect(await reply).toEqual({
      status: 'forbidden',
      reason: 'Only doctors can order medication',
    });
  });
});
