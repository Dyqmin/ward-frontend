# Worker with a duplicated cache

**Where:** `ward/trends/hr-trends.ts`, `wholeHistory()` vs `snapshotThenFrames()`, and
`ward/trends/trend-cache.ts`. Only meaningful with **Heavy calculation on the main thread** ✅.

A worker is a separate JavaScript world: its own heap, its own copy of every module it imports. A
module-level `Map` is a singleton per world. Import `trend-cache.ts` in the app **and** in the
worker, and you have two caches that know nothing about each other.

## See it

Set **Worker with a duplicated cache** to ❌, open the nurse station.

- **⚡ Perf gauges:** `trend cache · main thread values` and `trend cache · worker values` both
  ≈ 3,240 (18 beds × 180). With ✅ the main thread holds **0**.
- **trend · values posted to worker** grows by ~3,240 per second with ❌, by 18 with ✅.
- **Performance panel:** on the main thread, `postMessage` shows up in every frame task: the
  structured clone of the whole history, per bed, per second.
- **Memory → heap snapshot:** pick the worker in the dropdown at the top of the Memory panel.
  Each world has its own heap.

## Why

```ts
// ❌ BAD: main keeps the history AND sends all of it, the worker keeps another copy
worker.postMessage({
  kind: 'all',
  bed,
  hr: setHistory(
    bed,
    frames.map((f) => f.hr),
  ),
});

// ✅ GOOD: the worker owns the history. One snapshot, then one number per frame.
worker.postMessage({ kind: 'snapshot', bed, lastTs, hr });
worker.postMessage({ kind: 'frame', bed, ts, hr });
```

## Rules

- **One owner per piece of state.** If the worker computes from it, the worker keeps it.
- **Send deltas, not snapshots.** `postMessage` copies (structured clone) on the sending thread.
- Large numeric data: transfer an `ArrayBuffer` (`postMessage(msg, [buffer])`, zero-copy), or share
  a `SharedArrayBuffer` (needs cross-origin isolation).
- **End the worker** with its consumer: `worker.terminate()` in the teardown.
- Electron: renderer Web Workers (this note), Node `worker_threads` in the main process, or
  `utilityProcess` for a separate process with a `MessagePort`. The ownership rule is the same.
