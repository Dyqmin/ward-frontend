import { Component, computed, input, signal } from '@angular/core';

import {
  type StreamedVital,
  THRESHOLDS,
  type VitalsFrame,
} from '@wm/shared/domain';

interface Panel {
  vital: StreamedVital;
  label: string;
  unit: string;
  min: number;
  max: number;
}

/** One panel per vital: three scales never share one axis. */
const PANELS: readonly Panel[] = [
  { vital: 'hr', label: 'Heart rate', unit: 'bpm', min: 30, max: 180 },
  { vital: 'spo2', label: 'SpO₂', unit: '%', min: 80, max: 100 },
  { vital: 'rr', label: 'Respiratory rate', unit: '/min', min: 0, max: 40 },
];

const W = 600;
const H = 110;
/** 10 minutes at 1 Hz. */
const WINDOW = 600;

@Component({
  selector: 'wm-vitals-chart',
  templateUrl: './vitals-chart.html',
  styleUrl: './vitals-chart.scss',
})
export class VitalsChart {
  readonly frames = input.required<readonly VitalsFrame[]>();

  protected readonly width = W;
  protected readonly height = H;
  protected readonly hoverIndex = signal<number | null>(null);

  private readonly window = computed(() => this.frames().slice(-WINDOW));

  protected readonly panels = computed(() => {
    const frames = this.window();
    const x = (i: number) => (WINDOW - frames.length + i) * (W / (WINDOW - 1));
    return PANELS.map((p) => {
      const y = (v: number) =>
        H -
        ((Math.min(Math.max(v, p.min), p.max) - p.min) / (p.max - p.min)) * H;
      const t = THRESHOLDS[p.vital];
      return {
        ...p,
        latest: frames.at(-1)?.[p.vital],
        points: frames
          .map((f, i) => `${x(i).toFixed(1)},${y(f[p.vital]).toFixed(1)}`)
          .join(' '),
        thresholds: [t.low, t.high]
          .filter((v): v is number => v !== undefined)
          .map(y),
      };
    });
  });

  protected readonly hoverFrame = computed(() => {
    const i = this.hoverIndex();
    return i === null ? null : (this.window()[i] ?? null);
  });
  protected readonly hoverX = computed(() => {
    const i = this.hoverIndex();
    return i === null
      ? null
      : (WINDOW - this.window().length + i) * (W / (WINDOW - 1));
  });

  protected hover(e: PointerEvent): void {
    const svg = e.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    const slot = Math.round(
      ((e.clientX - rect.left) / rect.width) * (WINDOW - 1),
    );
    const offset = WINDOW - this.window().length;
    this.hoverIndex.set(
      slot < offset ? null : Math.min(slot - offset, this.window().length - 1),
    );
  }

  protected time(ts: number): string {
    return new Date(ts).toLocaleTimeString();
  }
}
