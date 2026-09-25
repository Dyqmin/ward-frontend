import { Component, computed, input, signal } from '@angular/core';

import { THRESHOLDS, type StreamedVital, type VitalsFrame } from '@core/messaging/contract';

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
  selector: 'app-vitals-chart',
  template: `
    @for (p of panels(); track p.vital) {
      <figure class="panel">
        <figcaption>
          <span>{{ p.label }}</span>
          <span class="latest">
            @if (hoverFrame(); as f) {
              {{ f[p.vital] }} {{ p.unit }} <span class="muted">at {{ time(f.ts) }}</span>
            } @else {
              {{ p.latest ?? '–' }} {{ p.unit }}
            }
          </span>
        </figcaption>
        <svg
          [attr.viewBox]="'0 0 ' + width + ' ' + height"
          preserveAspectRatio="none"
          role="img"
          [attr.aria-label]="p.label + ', last 10 minutes'"
          (pointermove)="hover($event)"
          (pointerleave)="hoverIndex.set(null)"
        >
          @for (t of p.thresholds; track t) {
            <line class="threshold" x1="0" [attr.x2]="width" [attr.y1]="t" [attr.y2]="t" />
          }
          <polyline class="line" [attr.points]="p.points" />
          @if (hoverX() !== null) {
            <line class="crosshair" [attr.x1]="hoverX()" [attr.x2]="hoverX()" y1="0" [attr.y2]="height" />
          }
        </svg>
      </figure>
    }
    <p class="muted axis"><span>−10 min</span><span>now</span></p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.5rem;
    }
    .panel {
      margin: 0;
    }
    figcaption {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--muted);
    }
    .latest {
      color: var(--text);
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    svg {
      width: 100%;
      height: 90px;
      display: block;
      background: var(--bg);
      border-radius: 6px;
      touch-action: none;
    }
    .line {
      fill: none;
      stroke: var(--accent);
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
      stroke-linejoin: round;
    }
    .threshold {
      stroke: var(--muted);
      stroke-dasharray: 4 4;
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
      opacity: 0.6;
    }
    .crosshair {
      stroke: var(--text);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
      opacity: 0.5;
    }
    .axis {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      margin: 0;
    }
  `,
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
      const y = (v: number) => H - ((Math.min(Math.max(v, p.min), p.max) - p.min) / (p.max - p.min)) * H;
      const t = THRESHOLDS[p.vital];
      return {
        ...p,
        latest: frames.at(-1)?.[p.vital],
        points: frames.map((f, i) => `${x(i).toFixed(1)},${y(f[p.vital]).toFixed(1)}`).join(' '),
        thresholds: [t.low, t.high].filter((v): v is number => v !== undefined).map(y),
      };
    });
  });

  protected readonly hoverFrame = computed(() => {
    const i = this.hoverIndex();
    return i === null ? null : (this.window()[i] ?? null);
  });
  protected readonly hoverX = computed(() => {
    const i = this.hoverIndex();
    return i === null ? null : (WINDOW - this.window().length + i) * (W / (WINDOW - 1));
  });

  protected hover(e: PointerEvent): void {
    const svg = e.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    const slot = Math.round(((e.clientX - rect.left) / rect.width) * (WINDOW - 1));
    const offset = WINDOW - this.window().length;
    this.hoverIndex.set(slot < offset ? null : Math.min(slot - offset, this.window().length - 1));
  }

  protected time(ts: number): string {
    return new Date(ts).toLocaleTimeString();
  }
}
