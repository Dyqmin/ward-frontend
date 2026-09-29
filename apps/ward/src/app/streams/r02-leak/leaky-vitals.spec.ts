import { TestBed } from '@angular/core/testing';

import type { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { withMockWard } from '../testing';
import { LeakyVitals } from './leaky-vitals';

// DAY 3 · R.3 (R.2 is checked with the counter in the browser).
// Run: pnpm nx test ward --include='**/leaky-vitals.spec.ts' --reporters=verbose

describe('R.2–3: the leak and the fix', () => {
  let bus: FakeMessageBus;
  let logs: unknown[];

  beforeEach(async () => {
    bus = await withMockWard();
    logs = [];
    vi.spyOn(console, 'log').mockImplementation(
      (m: unknown) => void logs.push(m),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('R.2 (ready-made): logs "ICU-3 HR <hr>" every second while it is on the page', async () => {
    const fixture = TestBed.createComponent(LeakyVitals);
    expect(bus.activeVitals()).toBe(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(
      logs.filter((l) => /^ICU-3 HR \d+$/.test(String(l))).length,
    ).toBeGreaterThanOrEqual(2);
    fixture.destroy();
  });

  it('R.3: ends its subscription when it is destroyed: the counter goes back to 0', async () => {
    const fixture = TestBed.createComponent(LeakyVitals);
    await vi.advanceTimersByTimeAsync(1500);
    expect(bus.activeVitals()).toBe(1);
    fixture.destroy();
    expect(bus.activeVitals()).toBe(0);
    const before = logs.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect(logs.length).toBe(before);
  });
});
