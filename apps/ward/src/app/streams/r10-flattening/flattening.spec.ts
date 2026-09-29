import { TestBed, type ComponentFixture } from '@angular/core/testing';

import type { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { requestsSent } from '../streams-data';
import { advance, text, withMockWard } from '../testing';
import Flattening from './flattening';

// DAY 3 · R.10–12. Run: pnpm nx test ward --include='**/flattening.spec.ts' --reporters=verbose

let bus: FakeMessageBus;
let fixture: ComponentFixture<Flattening>;
let el: HTMLElement;
const button = (label: string) =>
  [...el.querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => text(b) === label,
  );

beforeEach(async () => {
  bus = await withMockWard();
  requestsSent.set(0);
  fixture = TestBed.createComponent(Flattening);
  el = fixture.nativeElement as HTMLElement;
  await advance(fixture, 0);
});

afterEach(() => {
  fixture.destroy();
  vi.useRealTimers();
});

describe('R.10: switchMap', () => {
  it('shows "<bed>: <hr>" for ICU-1 at the start', async () => {
    await advance(fixture, 1500);
    expect(text(el.querySelector('p.live'))).toMatch(/^ICU-1: \d+$/);
  });

  it('always shows the bed clicked last, with ONE subscription', async () => {
    button('ICU-2')?.click();
    button('ICU-3')?.click();
    await advance(fixture, 0);
    for (let i = 0; i < 4; i++) {
      await advance(fixture, 1000);
      expect(text(el.querySelector('p.live'))).toMatch(/^ICU-3: \d+$/);
    }
    expect(bus.activeVitals()).toBe(1);
  });
});

describe('R.12: exhaustMap', () => {
  it('five quick clicks send ONE request', async () => {
    for (let i = 0; i < 5; i++) button('Acknowledge')?.click();
    await advance(fixture, 0);
    expect(requestsSent()).toBe(1);
    await advance(fixture, 1100);
    expect(text(el.querySelector('p.ack'))).toBe('acknowledged');
  });

  it('a click after the answer sends the next request', async () => {
    button('Acknowledge')?.click();
    await advance(fixture, 1100);
    button('Acknowledge')?.click();
    await advance(fixture, 0);
    expect(requestsSent()).toBe(2);
  });
});
