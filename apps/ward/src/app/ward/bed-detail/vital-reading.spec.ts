import { TestBed } from '@angular/core/testing';

import { VitalReading } from './vital-reading';

// DAY 2 · EXERCISE 2.1. Run: pnpm nx test ward --include='**/vital-reading.spec.ts'
describe('Exercise 2.1: VitalReading', () => {
  async function render(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(VitalReading);
    for (const [name, value] of Object.entries(inputs))
      fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('shows the label, the value and the unit', async () => {
    const { el } = await render({
      label: 'HR',
      vital: 'hr',
      value: 72,
      unit: 'bpm',
    });
    expect(el.querySelector('.label')?.textContent?.trim()).toBe('HR');
    expect(el.querySelector('.value')?.textContent?.trim()).toBe('72');
    expect(el.querySelector('.unit')?.textContent?.trim()).toBe('bpm');
  });

  it('renders no unit element when no unit is given', async () => {
    const { el } = await render({ label: 'SpO₂', vital: 'spo2', value: 97 });
    expect(el.querySelector('.unit')).toBeNull();
  });

  it('marks a value outside the thresholds with the "out" class', async () => {
    const { el } = await render({ label: 'HR', vital: 'hr', value: 131 });
    expect(el.querySelector('.value')?.classList).toContain('out');
  });

  it('follows the inputs: a new value re-evaluates "out"', async () => {
    const { fixture, el } = await render({
      label: 'HR',
      vital: 'hr',
      value: 72,
    });
    expect(el.querySelector('.value')?.classList).not.toContain('out');
    fixture.componentRef.setInput('value', 40);
    await fixture.whenStable();
    expect(el.querySelector('.value')?.textContent?.trim()).toBe('40');
    expect(el.querySelector('.value')?.classList).toContain('out');
  });

  it('puts the "stale" class on the host element', async () => {
    const { fixture, el } = await render({
      label: 'RR',
      vital: 'rr',
      value: 14,
    });
    expect(el.classList).not.toContain('stale');
    fixture.componentRef.setInput('stale', true);
    await fixture.whenStable();
    expect(el.classList).toContain('stale');
  });
});
