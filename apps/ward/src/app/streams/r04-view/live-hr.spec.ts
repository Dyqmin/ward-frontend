import { TestBed } from '@angular/core/testing';

import type { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { advance, text, withMockWard } from '../testing';
import LiveHr from './live-hr';

// DAY 3 · R.5 (R.4 is checked in the browser).
// Run: pnpm nx test ward --include='**/live-hr.spec.ts' --reporters=verbose

describe('R.5: the async pipe', () => {
  let bus: FakeMessageBus;

  beforeEach(async () => {
    bus = await withMockWard();
  });

  afterEach(() => vi.useRealTimers());

  it('the page follows every new value, and unsubscribes by itself when destroyed', async () => {
    const fixture = TestBed.createComponent(LiveHr);
    const el = fixture.nativeElement as HTMLElement;
    const shown = new Set<string>();
    for (let i = 0; i < 8; i++) {
      await advance(fixture, 1000);
      shown.add(text(el.querySelector('.hr')));
    }
    expect([...shown].every((t) => /^HR: \d+$/.test(t))).toBe(true);
    expect(shown.size).toBeGreaterThan(1); // it changed on screen
    expect(bus.activeVitals()).toBe(1);
    fixture.destroy();
    expect(bus.activeVitals()).toBe(0);
  });
});
