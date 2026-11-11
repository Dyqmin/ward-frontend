import { DestroyRef, inject } from '@angular/core';
import { Observable, defer, finalize } from 'rxjs';

import { PERF } from './perf-modes';

/**
 * Plain counters, NOT signals: they are written while templates render, where signal writes are
 * not allowed. The Perf panel samples them once a second.
 */

// ── template checks ─────────────────────────────────────────────────────────

const checks = new Map<string, number>();

/**
 * Call from a template: `{{ check('BedTile') }}`. Runs every time Angular re-runs that template,
 * so it counts change-detection checks. Shows the count only when counters are on.
 */
export function check(name: string): string {
  const n = (checks.get(name) ?? 0) + 1;
  checks.set(name, n);
  return PERF.counters ? String(n) : '';
}

export const checkTotals = (): ReadonlyMap<string, number> => checks;

// ── calculations ────────────────────────────────────────────────────────────

const calcs = new Map<string, number>();

/**
 * Call inside a derivation (getter, method, computed, pipe): counts how often it REALLY runs.
 * `n` counts units of work instead, e.g. how many items were copied.
 */
export function calc(name: string, n = 1): void {
  calcs.set(name, (calcs.get(name) ?? 0) + n);
}

export const calcTotals = (): ReadonlyMap<string, number> => calcs;

// ── live topic subscriptions ────────────────────────────────────────────────

const live = new Map<string, number>();

/** Counts who is subscribed to a topic right now. Applied by both message buses in watch(). */
export function countLive<T>(destination: string) {
  return (source: Observable<T>): Observable<T> =>
    defer(() => {
      live.set(destination, (live.get(destination) ?? 0) + 1);
      return source.pipe(
        finalize(() => {
          const n = (live.get(destination) ?? 1) - 1;
          if (n === 0) live.delete(destination);
          else live.set(destination, n);
        }),
      );
    });
}

export const liveSubscriptions = (): ReadonlyMap<string, number> => live;

// ── component instances ─────────────────────────────────────────────────────

export interface InstanceCount {
  created: number;
  destroyed: number;
  /** Garbage collected. `destroyed − collected` = destroyed but still in memory. */
  collected: number;
}

const instances = new Map<string, InstanceCount>();
const countOf = (name: string): InstanceCount => {
  let c = instances.get(name);
  if (!c) instances.set(name, (c = { created: 0, destroyed: 0, collected: 0 }));
  return c;
};

/** Tells us when the garbage collector really freed an object. It does NOT keep it alive. */
const gc = new FinalizationRegistry<string>(
  (name) => countOf(name).collected++,
);

/**
 * Call in a constructor: `trackInstance(this, 'BedDetail')`. A component that is destroyed but
 * never collected is a leak. Collect garbage with the 🗑 button in DevTools → Memory.
 */
export function trackInstance(instance: object, name: string): void {
  countOf(name).created++;
  gc.register(instance, name);
  inject(DestroyRef).onDestroy(() => countOf(name).destroyed++); // no reference to `instance`
}

export const instanceCounts = (): ReadonlyMap<string, InstanceCount> =>
  instances;

// ── gauges ──────────────────────────────────────────────────────────────────

const gauges = new Map<string, () => number>();

/** Any number worth watching, e.g. the size of a cache. Shown in the Perf panel. */
export function gauge(name: string, read: () => number): void {
  gauges.set(name, read);
}

export const gaugeValues = (): [string, number][] =>
  [...gauges].map(([name, read]) => [name, read()]);
