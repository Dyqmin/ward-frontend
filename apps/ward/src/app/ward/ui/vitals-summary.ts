import type { VitalsFrame } from '@core/messaging/contract';
import { gauge } from '@perf/perf-stats';

/** The tile's tooltip: "HR 82 bpm · SpO₂ 97 % · RR 16 /min at 14:03:22". */
export function summarize(f: VitalsFrame): string {
  const at = new Date(f.ts).toLocaleTimeString();
  return `HR ${f.hr} bpm · SpO₂ ${f.spo2} % · RR ${f.rr} /min at ${at}`;
}

// ❌ BAD (M4): "memoized" in a Map keyed by the frame. A new frame arrives every second per bed and
// nothing is ever removed: the Map keeps every frame (and its string) alive forever.
const memo = new Map<VitalsFrame, string>();
gauge('M4 tooltip Map', () => memo.size);

export function summaryLeaky(f: VitalsFrame): string {
  let s = memo.get(f);
  if (s === undefined) memo.set(f, (s = summarize(f)));
  return s;
}

// ✅ GOOD (M4): a WeakMap does not keep its keys alive — when nobody else holds the frame, the entry
// goes with it. (Here the best fix is no cache at all: a computed() already runs once per frame.)
const weak = new WeakMap<VitalsFrame, string>();

export function summary(f: VitalsFrame): string {
  let s = weak.get(f);
  if (s === undefined) weak.set(f, (s = summarize(f)));
  return s;
}
