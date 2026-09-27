import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthStore } from '../auth/auth-store';
import { commandRetry } from './command-retry';
import { MessageBus } from './contract';
import { FakeMessageBus } from './fake-message-bus';
import { provideStomp, withMockBroker } from './provide-stomp';
import { createWardFixtures, MockWard } from '../../testing/ward-fixtures';

describe('commandRetry', () => {
  let ward: MockWard;
  let bus: FakeMessageBus;

  beforeEach(async () => {
    sessionStorage.clear();
    vi.useFakeTimers();
    ward = new MockWard();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideStomp({}, withMockBroker(createWardFixtures(ward))),
      ],
    });
    await TestBed.inject(AuthStore).join('Ann', 'nurse', 'ward-demo');
    bus = TestBed.inject(MessageBus) as FakeMessageBus;
  });

  afterEach(() => vi.useRealTimers());

  it('retries as soon as the broker is back instead of waiting out the back-off', async () => {
    const orderId = [...ward.orders.keys()][0];
    if (!orderId) throw new Error('fixture has no orders');
    bus.simulateOutage(4_000);
    const result = firstValueFrom(
      bus
        .send('/app/medication.given', { id: orderId })
        .pipe(commandRetry(bus)),
    );
    // back-off alone would retry at 0.5, 1.5, 3.5, 7.5 s; reconnect at 4 s triggers an attempt within 250 ms
    await vi.advanceTimersByTimeAsync(4_600);
    expect(await result).toEqual({ status: 'accepted', value: null });
    expect(new Set(bus.log().map((e) => e.commandId)).size).toBe(1);
  });
});
