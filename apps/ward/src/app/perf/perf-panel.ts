import { Component, DestroyRef, inject, signal } from '@angular/core';

import {
  PERF,
  TOPICS,
  TOPIC_IDS,
  applyPerf,
  type Mode,
  type Topic,
} from './perf-modes';
import {
  calcTotals,
  checkTotals,
  gaugeValues,
  instanceCounts,
  liveSubscriptions,
} from './perf-stats';

interface Sample {
  checksPerSec: [string, number][];
  checksTotal: number;
  calcsPerSec: [string, number][];
  subscriptions: [string, number][];
  subscriptionsTotal: number;
  instances: { name: string; onScreen: number; retained: number }[];
  gauges: [string, number][];
  heapMb: number | null;
}

/** Day 6 · switch topics between ❌ bad and ✅ good, and watch the numbers. */
@Component({
  selector: 'app-perf-panel',
  templateUrl: './perf-panel.html',
  styleUrl: './perf-panel.scss',
})
export class PerfPanel {
  protected readonly topics = TOPIC_IDS.map((id) => ({ id, ...TOPICS[id] }));
  protected readonly perf = PERF;
  protected readonly open = signal(false);
  protected readonly sample = signal<Sample | null>(null);
  protected readonly anyBad = TOPIC_IDS.some((t) => PERF.modes[t] === 'bad');

  private lastChecks = new Map<string, number>();
  private lastCalcs = new Map<string, number>();

  constructor() {
    // ✅ a timer that is cleared when the component goes away (see M2)
    const id = setInterval(() => this.take(), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  protected setMode(topic: Topic, mode: Mode): void {
    applyPerf({ ...PERF, modes: { ...PERF.modes, [topic]: mode } });
  }

  protected setAll(mode: Mode): void {
    const modes = Object.fromEntries(TOPIC_IDS.map((t) => [t, mode]));
    applyPerf({ ...PERF, modes: modes as Record<Topic, Mode> });
  }

  protected setStress(stress: number): void {
    applyPerf({ ...PERF, stress });
  }

  protected setCounters(counters: boolean): void {
    applyPerf({ ...PERF, counters });
  }

  private take(): void {
    const perSec = this.rate(checkTotals(), this.lastChecks);
    this.lastChecks = new Map(checkTotals());
    const calcsPerSec = this.rate(calcTotals(), this.lastCalcs);
    this.lastCalcs = new Map(calcTotals());

    const subs = [...liveSubscriptions()].sort((a, b) => b[1] - a[1]);
    const memory = (performance as { memory?: { usedJSHeapSize: number } })
      .memory;

    if (!this.open()) return; // closed: count, but do not re-render
    this.sample.set({
      checksPerSec: perSec,
      checksTotal: perSec.reduce((s, [, n]) => s + n, 0),
      calcsPerSec,
      subscriptions: subs,
      subscriptionsTotal: subs.reduce((s, [, n]) => s + n, 0),
      instances: [...instanceCounts()].map(([name, c]) => ({
        name,
        onScreen: c.created - c.destroyed,
        retained: c.destroyed - c.collected,
      })),
      gauges: gaugeValues(),
      heapMb: memory ? memory.usedJSHeapSize / 1_048_576 : null,
    });
  }

  private rate(
    totals: ReadonlyMap<string, number>,
    last: ReadonlyMap<string, number>,
  ): [string, number][] {
    return [...totals].map(([name, n]) => [name, n - (last.get(name) ?? 0)]);
  }
}
