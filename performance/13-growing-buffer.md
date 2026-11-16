# Live buffer that only grows

**Where:** `bed-detail/snapshot-then-stream.ts`. The `scan()` there collects the vitals frames the
chart draws.

Not every memory problem appears when you leave a page. Some appear while you **stay**. A
monitoring screen is left open for a 12-hour shift, and a buffer that collects a live stream
without a limit grows the whole time.

## See it

Set **Live buffer that only grows** to ❌ and open a bed. Then stay there.

- **⚡ Perf gauge:** **vitals buffer · frames** goes 600 → 601 → 602… one per second, and never
  stops. With ✅ it stays at **600**.
- **The screen looks fine.** The chart only draws the last 10 minutes, so nobody notices.
- **Memory → Heap snapshot**, wait 30 s, take a second one, then switch the second snapshot from
  _Summary_ to **Comparison** and type `bed` into **Filter by class**. One row is left, the frames:
  `{bed, ts, hr, spo2, rr}`.

  |     | # New | # Deleted | # Delta |
  | --- | ----- | --------- | ------- |
  | ❌  | 30    | 0         | **+30** |
  | ✅  | 30    | 30        | 0       |

  With ✅ a frame leaves for every frame that arrives. With ❌ nothing ever leaves.

- **Allocations on timeline does not help here.** In a short recording ❌ and ✅ look the same:
  with ✅ every frame from the last 10 minutes is still alive too, so its bar is just as blue. A
  buffer that grows while you stay is found by counting (the gauge, or two snapshots), not by a
  20 s profile.

## Why

```ts
// ❌ BAD: every frame, forever. After 12 h that's 43,200 frames, and each new frame copies them all.
scan((acc, frame) => [...acc, frame], []);

// ✅ GOOD: keep what the screen needs
scan((acc, frame) => [...acc, frame].slice(-VITALS_WINDOW), []);
```

It costs twice. **Memory** grows by one frame per second. **CPU** grows too: every new frame copies
the whole array, so frame 43,200 copies 43,200 items.

## Same trap, other places

| Grows forever                                | Give it a limit                                             |
| -------------------------------------------- | ----------------------------------------------------------- |
| `scan()` / a store that appends live data    | `.slice(-N)`, or a fixed-size ring buffer                   |
| `ReplaySubject()`, `shareReplay()`           | `new ReplaySubject(1)`, `shareReplay({ bufferSize: 1, … })` |
| logs, toasts, notifications, undo history    | keep the last N                                             |
| a `Map` cache keyed by id, never pruned      | LRU / TTL, or a service scoped to the route                 |
| infinite scroll: every page stays in the DOM | virtual scroll (`@angular/cdk/scrolling`)                   |

## Rules

- **Anything that collects a stream needs a limit.** Decide it up front, from what the screen shows.
- **Test it in time, not in clicks.** Leave the page open, then compare heap snapshots a few minutes
  apart.
- **A leak isn't only "after destroy".** A page that is never left can leak too.
