import { provideHttpClient } from '@angular/common/http';
import { type OutputRef, reflectComponentType } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import type { AlarmView } from '@wm/monitoring/domain';
import { AuthStore } from '@wm/shared/data-access-auth';
import {
  FakeMessageBus,
  MessageBus,
  provideStomp,
  withMockBroker,
} from '@wm/shared/data-access-messaging';
import { Toasts } from '@wm/shared/data-access-toasts';

import { VitalsCard } from './vitals-card';

// DAY 2 · THE VITALS CARD, Parts 1 and 2.
// Run: pnpm nx test ward --include='**/vitals-card.spec.ts'
// The card runs against the in-memory ward (?mock) with a fake clock: one frame per second.

const ALARM: AlarmView = {
  event: {
    status: 'raised',
    alarmId: 'alarm_1',
    bed: 'ICU-3',
    code: 'hr.high',
    value: 143,
  },
  code: 'hr.high',
  value: 143,
};

let fixture: ComponentFixture<VitalsCard>;
let el: HTMLElement;

const text = (e: Element | null | undefined) =>
  e?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const button = (label: RegExp) =>
  [...el.querySelectorAll('button')].find((b) => label.test(text(b)));
const chips = () => [...el.querySelectorAll('.chip')].map((c) => text(c));
/** HR, SpO₂ and RR as shown, whether as plain text (1.1) or as <wm-vital-reading> (2.2). */
const numbers = () => {
  const t = text(el.querySelector('section'));
  return ['HR', 'SpO₂', 'RR'].map(
    (l) => t.match(new RegExp(`${l}\\D*(\\d+)`))?.[1],
  );
};

async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  fixture.detectChanges();
  await fixture.whenStable();
}

function onOutput<T>(name: string, fn: (v: T) => void): void {
  const out = reflectComponentType(VitalsCard)?.outputs.find(
    (o) => o.templateName === name,
  );
  if (!out) throw new Error(`VitalsCard has no output named "${name}"`);
  (fixture.componentInstance as unknown as Record<string, OutputRef<T>>)[
    out.propName
  ]?.subscribe(fn);
}

beforeEach(async () => {
  sessionStorage.clear();
  vi.useFakeTimers();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideStomp({}, withMockBroker())],
  });
  await TestBed.inject(AuthStore).join('Ann', 'nurse', 'ward-demo');
  fixture = TestBed.createComponent(VitalsCard);
  fixture.componentRef.setInput('bed', 'ICU-3');
  el = fixture.nativeElement as HTMLElement;
  fixture.detectChanges();
});

afterEach(() => vi.useRealTimers());

describe('live data', () => {
  it('shows a skeleton until the first frame', () => {
    expect(el.querySelector('ngx-skeleton-loader')).not.toBeNull();
  });

  it('shows HR, SpO₂ and RR once frames arrive, and follows them', async () => {
    await advance(1500);
    expect(numbers().every((n) => n !== undefined)).toBe(true);
    expect(el.querySelector('ngx-skeleton-loader')).toBeNull();
  });
});

describe('stale or live', () => {
  it('says "live" while frames arrive', async () => {
    await advance(1500);
    expect(chips()).toContain('live');
  });

  it('says how old the data is during an outage, and goes back to "live"', async () => {
    await advance(1500);
    (TestBed.inject(MessageBus) as FakeMessageBus).simulateOutage(8000);
    await advance(5000);
    expect(chips().some((c) => /^no data for \d+ s$/.test(c))).toBe(true);
    await advance(6000);
    expect(chips()).toContain('live');
  });
});

describe('Exercise 1.4a + 1.4b: pause', () => {
  // Goes red during 2.3 (the card can no longer change `paused` itself) and green again in 2.4.
  it('freezes the numbers and says "paused"; Resume lets them run again', async () => {
    await advance(1500);
    button(/^pause$/i)?.click();
    await advance(0);
    const frozen = numbers();
    expect(button(/^resume$/i)).toBeDefined();
    expect(chips()).toContain('paused');
    await advance(5000);
    expect(numbers()).toEqual(frozen);
    button(/^resume$/i)?.click();
    await advance(1500);
    expect(chips()).toContain('live');
  });
});

describe('stale toast', () => {
  it('shows exactly one warning per outage', async () => {
    await advance(1500);
    const toasts0 = TestBed.inject(Toasts).items().length;
    (TestBed.inject(MessageBus) as FakeMessageBus).simulateOutage(8000);
    await advance(3000); // a toast lives 5 s
    const toasts = TestBed.inject(Toasts)
      .items()
      .filter((t) => t.text === 'ICU-3: no live vitals');
    expect(toasts0).toBe(0); // no toast while the data is live
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.kind).toBe('warn');
  });
});

describe('readings and alarms', () => {
  it('shows the three values as <wm-vital-reading>', async () => {
    await advance(1500);
    const readings = el.querySelectorAll('wm-vital-reading');
    expect(readings).toHaveLength(3);
    expect([...readings].map((r) => text(r.querySelector('.label')))).toEqual([
      'HR',
      'SpO₂',
      'RR',
    ]);
  });

  it('shows one chip per alarm, from the alarms input', async () => {
    fixture.componentRef.setInput('alarms', [ALARM]);
    await advance(1500);
    const chip = [...el.querySelectorAll('.chip')].find((c) =>
      text(c).startsWith('HR high'),
    );
    expect(text(chip)).toBe('HR high (143) · raised');
    expect(chip?.classList).toContain('bad');
  });
});

describe('pause, owned by the parent', () => {
  it('emits pausedChange(true) when Pause is clicked', async () => {
    const events: boolean[] = [];
    onOutput<boolean>('pausedChange', (v) => events.push(v));
    await advance(1500);
    button(/^pause$/i)?.click();
    expect(events).toEqual([true]);
  });
});

describe('pause, two-way', () => {
  it('accepts paused from the parent', async () => {
    fixture.componentRef.setInput('paused', true);
    await advance(1500);
    expect(button(/^resume$/i)).toBeDefined();
  });

  it('flips its own button, with no parent to feed the value back', async () => {
    await advance(1500);
    button(/^pause$/i)?.click();
    await advance(0);
    expect(button(/^resume$/i)).toBeDefined();
  });
});

describe('full screen', () => {
  it('asks the card\'s own <section class="card vitals"> to go full screen', async () => {
    const calls: Element[] = [];
    const original = HTMLElement.prototype.requestFullscreen;
    HTMLElement.prototype.requestFullscreen = function (this: HTMLElement) {
      calls.push(this);
      return Promise.resolve();
    };
    try {
      await advance(1500);
      button(/full ?screen/i)?.click();
      expect(calls).toHaveLength(1);
      expect(calls[0]?.matches('section.card.vitals')).toBe(true);
    } finally {
      HTMLElement.prototype.requestFullscreen = original;
    }
  });
});
