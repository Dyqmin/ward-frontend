# M4 · Cache that only grows

**Where:** `ward/ui/vitals-summary.ts`, used by `bed-tile.ts` for the tooltip.

## See it

M4 ❌, stay on the nurse station (Stress ×10 makes it fast).

- ⚡ Perf gauge: **M4 tooltip Map** +18 per second (+180 with ×10). Forever.
- Performance monitor: JS heap — a staircase, not a sawtooth.
- Two heap snapshots a minute apart → Comparison → `Map` / `Object` / `(string)`: thousands new.

## Why

```ts
// ❌ BAD: a Map keeps its keys alive. A new frame every second, nothing ever removed.
const memo = new Map<VitalsFrame, string>();

// ✅ GOOD: a WeakMap does not keep its keys alive
const weak = new WeakMap<VitalsFrame, string>();
```

Even better here: no cache. The tooltip is a `computed()`, which already runs once per frame.

## Rules

- Every cache needs a limit: size (LRU), time (TTL), or lifetime (`WeakMap`, or a service
  provided on the route/component so it dies with it).
- Same trap: logs/history arrays (`push` forever), `shareReplay()` with no buffer size,
  `ReplaySubject()` with no limit, a `Map` keyed by id that is never pruned.
