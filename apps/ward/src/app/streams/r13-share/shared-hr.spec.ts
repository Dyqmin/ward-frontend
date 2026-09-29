import { TestBed } from '@angular/core/testing';

import type { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { advance, text, withMockWard } from '../testing';
import SharedHr from './shared-hr';

// DAY 3 · R.13. Run: pnpm nx test ward --include='**/shared-hr.spec.ts' --reporters=verbose

describe('R.13: shareReplay', () => {
  let bus: FakeMessageBus;

  beforeEach(async () => {
    bus = await withMockWard();
  });

  afterEach(() => vi.useRealTimers());

  it('two places on the page, ONE subscription', async () => {
    const fixture = TestBed.createComponent(SharedHr);
    await advance(fixture, 1500);
    expect(bus.activeVitals()).toBe(1);
    const el = fixture.nativeElement as HTMLElement;
    expect(text(el.querySelector('.big'))).toMatch(/^\d+$/);
    expect(text(el.querySelector('.small'))).toBe(
      `ICU-3 heart rate: ${text(el.querySelector('.big'))} bpm`,
    );
    fixture.destroy();
  });

  it('refCount: leaving the page ends the shared subscription', async () => {
    const fixture = TestBed.createComponent(SharedHr);
    await advance(fixture, 1500);
    expect(bus.activeVitals()).toBe(1);
    fixture.destroy();
    expect(bus.activeVitals()).toBe(0);
  });
});
