import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthStore } from '@core/auth/auth-store';
import { commandRetry } from '@core/messaging/command-retry';
import { MessageBus } from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { provideStomp, withMockBroker } from '@core/messaging/provide-stomp';
import { createWardFixtures, MockWard } from '../../testing/ward-fixtures';

describe('lab: record a temperature', () => {
  let ward: MockWard;
  let bus: FakeMessageBus;

  beforeEach(async () => {
    sessionStorage.clear();
    vi.useFakeTimers();
    ward = new MockWard();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideStomp({}, withMockBroker(createWardFixtures(ward)))],
    });
    await TestBed.inject(AuthStore).join('Ann', 'nurse', 'ward-demo');
    bus = TestBed.inject(MessageBus) as FakeMessageBus;
  });

  afterEach(() => vi.useRealTimers());

  const record = (value: number) =>
    firstValueFrom(bus.send('/app/vitals.record', { bed: 'ICU-3', vital: 'temp', value }).pipe(commandRetry(bus)));

  it('accepts 37.2 and refuses 51 as implausible', async () => {
    const ok = record(37.2);
    const bad = record(51);
    await vi.advanceTimersByTimeAsync(300);
    expect(await ok).toEqual({ status: 'accepted', value: null });
    expect(await bad).toEqual({ status: 'forbidden', reason: 'Implausible value' });
  });

  it('records exactly one reading through an 8 s outage, retrying with the same commandId', async () => {
    bus.simulateOutage(8_000);
    const result = record(37.2);
    await vi.advanceTimersByTimeAsync(10_000);

    expect(await result).toEqual({ status: 'accepted', value: null });
    const attempts = bus.log().filter((e) => e.destination === '/app/vitals.record');
    expect(attempts.filter((e) => e.outcome === 'offline').length).toBeGreaterThanOrEqual(2);
    expect(new Set(attempts.map((e) => e.commandId)).size).toBe(1);
    expect(ward.readings.get('ICU-3')).toHaveLength(1);
  });

  it('retries as soon as the broker is back instead of waiting out the back-off', async () => {
    bus.simulateOutage(4_000);
    const result = record(37.4);
    // back-off alone would retry at 0.5, 1.5, 3.5, 7.5 s; reconnect at 4 s triggers an attempt within 250 ms
    await vi.advanceTimersByTimeAsync(4_600);
    expect(await result).toEqual({ status: 'accepted', value: null });
  });

  it('sends the same command twice and still records one reading', async () => {
    const once$ = bus.send('/app/vitals.record', { bed: 'ICU-4', vital: 'temp', value: 36.9 });
    const a = firstValueFrom(once$);
    const b = firstValueFrom(once$);
    await vi.advanceTimersByTimeAsync(300);
    expect(await a).toEqual(await b);
    expect(ward.readings.get('ICU-4')).toHaveLength(1);
  });
});
