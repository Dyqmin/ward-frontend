import {
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  type OutputRef,
  reflectComponentType,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { VitalsFrame } from '@wm/shared/domain';

import type { AlarmView } from '../../../data/alarms-store';
import { VitalsPanel } from './vitals-panel';

// The panel is created WITHOUT any providers: a presentational component must not need them.

const FRAME: VitalsFrame = { bed: 'ICU-3', ts: 1, hr: 72, spo2: 97, rr: 14 };
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

const text = (e: Element | null | undefined) =>
  e?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

async function render(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(VitalsPanel);
  for (const [name, value] of Object.entries(inputs))
    fixture.componentRef.setInput(name, value);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const chips = () => [...el.querySelectorAll('.chip')].map((c) => text(c));
  const button = (label: RegExp) =>
    [...el.querySelectorAll('button')].find((b) => label.test(text(b)));
  return { fixture, el, chips, button };
}

describe('VitalsPanel', () => {
  it('shows the three readings of the frame it is given', async () => {
    const { el } = await render({ frame: FRAME });
    const values = [...el.querySelectorAll('app-vital-reading .value')].map(
      (v) => text(v),
    );
    expect(values).toEqual(['72', '97', '14']);
  });

  it('shows a skeleton while there is no frame', async () => {
    const { el } = await render({ frame: undefined });
    expect(el.querySelector('ngx-skeleton-loader')).not.toBeNull();
    expect(el.querySelectorAll('app-vital-reading')).toHaveLength(0);
  });

  it('shows the chip it is told to: live, stale or paused', async () => {
    expect((await render({ frame: FRAME })).chips()).toContain('live');
    expect(
      (await render({ frame: FRAME, stale: true, ageSec: 5 })).chips(),
    ).toContain('no data for 5 s');
    expect((await render({ frame: FRAME, paused: true })).chips()).toContain(
      'paused',
    );
  });

  it('shows the alarm chips', async () => {
    const { chips } = await render({ frame: FRAME, alarms: [ALARM] });
    expect(chips()).toContain('HR high (143) · raised');
  });

  it('reports Pause through pausedChange', async () => {
    const { fixture, button } = await render({ frame: FRAME });
    const out = reflectComponentType(VitalsPanel)?.outputs.find(
      (o) => o.templateName === 'pausedChange',
    );
    const events: boolean[] = [];
    (
      fixture.componentInstance as unknown as Record<string, OutputRef<boolean>>
    )[out?.propName ?? '']?.subscribe((v) => events.push(v));
    button(/^pause$/i)?.click();
    expect(events).toEqual([true]);
  });

  it('projects its content (the chart)', async () => {
    const projected = document.createElement('p');
    projected.className = 'projected';
    const ref = createComponent(VitalsPanel, {
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
