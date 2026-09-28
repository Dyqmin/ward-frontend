import {
  ApplicationRef,
  EnvironmentInjector,
  createComponent,
  reflectComponentType,
  type OutputRef,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { VitalsFrame } from '@core/messaging/contract';
import { VitalsCard } from './vitals-card';

// DAY 2 · EXERCISES 2.2–2.5. Run: pnpm nx test ward --include='**/vitals-card.spec.ts'
// The card is created WITHOUT any providers: a presentational component must not need them (3.2).
const FRAME: VitalsFrame = { bed: 'ICU-3', ts: 1, hr: 72, spo2: 97, rr: 14 };

async function render(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(VitalsCard);
  for (const [name, value] of Object.entries(inputs))
    fixture.componentRef.setInput(name, value);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

const text = (el: Element | null | undefined) =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
/** Subscribe to an output by its public name, whether it is an output() or a model(). */
function onOutput<T>(instance: object, name: string, fn: (v: T) => void): void {
  const out = reflectComponentType(VitalsCard)?.outputs.find(
    (o) => o.templateName === name,
  );
  if (!out) throw new Error(`VitalsCard has no output named "${name}"`);
  (instance as Record<string, OutputRef<T>>)[out.propName]?.subscribe(fn);
}
const button = (el: HTMLElement, label: RegExp) =>
  [...el.querySelectorAll('button')].find((b) => label.test(text(b)));

describe('Exercise 2.2: VitalsCard inputs', () => {
  it('shows HR, SpO₂ and RR from the frame, as three app-vital-reading', async () => {
    const { el } = await render({ frame: FRAME });
    const readings = el.querySelectorAll('app-vital-reading');
    expect(readings).toHaveLength(3);
    expect([...readings].map((r) => text(r.querySelector('.value')))).toEqual([
      '72',
      '97',
      '14',
    ]);
  });

  it('says "live" when the data is fresh', async () => {
    const { el } = await render({ frame: FRAME });
    expect(text(el.querySelector('.chip'))).toBe('live');
  });

  it('says how old the data is when it is stale', async () => {
    const { el } = await render({ frame: FRAME, stale: true, ageSec: 5 });
    expect(text(el)).toContain('no data for 5 s');
    expect(text(el)).not.toMatch(/\blive\b/);
  });

  it('shows no readings and no chip before the first frame', async () => {
    const { el } = await render({ frame: undefined });
    expect(el.querySelectorAll('app-vital-reading')).toHaveLength(0);
    expect(el.querySelector('.chip')).toBeNull();
  });

  it('projects its content (the chart) with <ng-content>', async () => {
    const projected = document.createElement('p');
    projected.className = 'projected';
    const ref = createComponent(VitalsCard, {
      environmentInjector: TestBed.inject(EnvironmentInjector),
      projectableNodes: [[projected]],
    });
    ref.setInput('frame', FRAME);
    TestBed.inject(ApplicationRef).attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    expect(
      (ref.location.nativeElement as HTMLElement).querySelector('.projected'),
    ).not.toBeNull();
    ref.destroy();
  });
});

describe('Exercise 2.3: VitalsCard output', () => {
  it('emits pausedChange(true) when Pause is clicked', async () => {
    const { fixture, el } = await render({ frame: FRAME });
    const events: boolean[] = [];
    onOutput<boolean>(fixture.componentInstance, 'pausedChange', (v) =>
      events.push(v),
    );
    button(el, /^pause$/i)?.click();
    expect(events).toEqual([true]);
  });
});

describe('Exercise 2.4: VitalsCard model', () => {
  it('flips its own Pause / Resume button, with no parent to feed it back', async () => {
    const { fixture, el } = await render({ frame: FRAME });
    button(el, /^pause$/i)?.click();
    await fixture.whenStable();
    expect(button(el, /^resume$/i)).toBeDefined();
    expect(text(el.querySelector('.chip'))).toBe('paused');
  });

  it('accepts paused from the parent', async () => {
    const { el } = await render({ frame: FRAME, paused: true });
    expect(button(el, /^resume$/i)).toBeDefined();
  });
});

describe('Exercise 2.5: VitalsCard viewChild', () => {
  it('Full screen asks the card element itself to go full screen', async () => {
    const calls: Element[] = [];
    const original = HTMLElement.prototype.requestFullscreen;
    HTMLElement.prototype.requestFullscreen = function (this: HTMLElement) {
      calls.push(this);
      return Promise.resolve();
    };
    try {
      const { el } = await render({ frame: FRAME });
      button(el, /full ?screen/i)?.click();
      expect(calls).toHaveLength(1);
      expect(calls[0]?.classList).toContain('vitals');
    } finally {
      HTMLElement.prototype.requestFullscreen = original;
    }
  });
});
