import type { BedId } from '@core/messaging/contract';
import { TREND_WINDOW } from './hr-trend';

/**
 * The last TREND_WINDOW heart rates per bed.
 *
 * A module-level Map is a singleton... per JavaScript realm. A worker is another realm: it gets its
 * OWN copy of this module and its own Map. Import this file on both sides and you have two caches
 * (❌ worker-cache). Use it on one side only (✅): the worker owns it.
 */
const history = new Map<BedId, number[]>();

export function setHistory(bed: BedId, values: readonly number[]): number[] {
  const kept = values.slice(-TREND_WINDOW);
  history.set(bed, kept);
  return kept;
}

export function append(bed: BedId, value: number): number[] {
  return setHistory(bed, [...(history.get(bed) ?? []), value]);
}

/** Values held in THIS realm's copy of the cache. */
export function heldValues(): number {
  let n = 0;
  for (const v of history.values()) n += v.length;
  return n;
}
