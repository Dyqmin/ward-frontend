import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import {
  THRESHOLDS,
  type StreamedVital,
  type VitalsFrame,
} from '@core/messaging/contract';
import { isBad } from '@perf/perf-modes';
import { check, trackInstance } from '@perf/perf-stats';

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
  templateUrl: './vitals-chart.html',
  styleUrl: './vitals-chart.scss',
})
export class VitalsChart {
  readonly frames = input.required<readonly VitalsFrame[]>();

  protected readonly width = W;
  protected readonly height = H;
  protected readonly hoverIndex = signal<number | null>(null);

  private readonly window = computed(() => this.frames().slice(-WINDOW));

  protected readonly bad = { p4: isBad('p4') };
  protected readonly check = check;
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Where the plot is on screen. Hover maps clientX to a frame with it. */
  private box: { left: number; width: number } | null = null;

  constructor() {
    trackInstance(this, 'VitalsChart');
    const measure = () => this.measure();

    if (isBad('m2')) {
      // ❌ BAD (M2): a window listener and a timer that nobody ever removes. Both callbacks hold
      // `this`: after the page is left, the chart and its SVG stay in memory ("Detached" in a heap
      // snapshot), and the timer keeps running — one more per visit.
      window.addEventListener('resize', measure);
      setInterval(measure, 1000); // "in case the layout changed"
    } else {
      // ✅ GOOD (M2): one ResizeObserver on our own element, disconnected on destroy.
      // No polling: the browser tells us when the size really changes.
      const observer = new ResizeObserver(measure);
      observer.observe(this.host);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  private measure(): void {
    const svg = this.host.querySelector('svg');
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    this.box = { left: r.left, width: r.width };
  }

  // ✅ GOOD (P4): a computed() — 3 × 600 points are built once per new frame, not on every check.
  protected readonly panels = computed(() => {
    const frames = this.window();
    return PANELS.map((p) => {
      const y = scaleY(p);
      const t = THRESHOLDS[p.vital];
      return {
        ...p,
        latest: frames.at(-1)?.[p.vital],
        points: this.bad.p4 ? '' : pointsOf(frames, p),
        thresholds: [t.low, t.high]
          .filter((v): v is number => v !== undefined)
          .map(y),
      };
    });
  });

  // ❌ BAD (P4): a method called from the template. It rebuilds 600 points on EVERY check of this
  // component — and with a pointermove listener in the template, that is every mouse move.
  protected pointsOf(vital: StreamedVital): string {
    const p = PANELS.find((x) => x.vital === vital) as Panel;
    return pointsOf(this.window(), p);
  }

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
    let left: number;
    let width: number;
    if (this.bad.p4) {
      // ❌ BAD (P4): reads layout on every pointermove. After a DOM change this forces the browser
      // to lay out the page synchronously ("Forced reflow" in the Performance panel).
      const r = (e.currentTarget as SVGElement).getBoundingClientRect();
      left = r.left;
      width = r.width;
    } else {
      // ✅ GOOD (P4): measured once (and again on resize), read from a field here.
      if (!this.box) this.measure();
      ({ left, width } = this.box ?? { left: 0, width: 1 });
    }
    const slot = Math.round(((e.clientX - left) / width) * (WINDOW - 1));
    const offset = WINDOW - this.window().length;
    // a signal: setting the same index again changes nothing and re-renders nothing
    this.hoverIndex.set(
      slot < offset ? null : Math.min(slot - offset, this.window().length - 1),
    );
  }

  protected time(ts: number): string {
    return new Date(ts).toLocaleTimeString();
  }
}

const scaleY =
  (p: Panel) =>
  (v: number): number =>
    H - ((Math.min(Math.max(v, p.min), p.max) - p.min) / (p.max - p.min)) * H;

function pointsOf(frames: readonly VitalsFrame[], p: Panel): string {
  const x = (i: number) => (WINDOW - frames.length + i) * (W / (WINDOW - 1));
  const y = scaleY(p);
  return frames
    .map((f, i) => `${x(i).toFixed(1)},${y(f[p.vital]).toFixed(1)}`)
    .join(' ');
}
