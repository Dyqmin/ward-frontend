# `mergeMap` / nested `subscribe()` vs `switchMap`

**Where:** `bed-detail.ts`, the live heart rate in the tab title. Click **Next bed →**.

`takeUntilDestroyed()` ends a subscription when the component is destroyed. However, going from
`/ward/icu-1` to `/ward/icu-2` does **not** destroy `BedDetail`. The router reuses it, and only the
params change. So the question is: what happens to the previous bed's stream?

## See it

Set **mergeMap / nested subscribe** to ❌. Open ICU-1, then click Next bed → Next bed.

- ⚡ Perf → Live subscriptions: `vitals.ICU-1`, `vitals.ICU-2` **and** `vitals.ICU-3`, although you
  only look at ICU-3. One more for every bed you step through.
- With a real broker the frames interleave, so the tab title flickers between beds: **the wrong
  patient's heart rate**. (In mock mode all beds tick together, so the last bed always wins and you
  won't see the flicker.)
- With ✅ you see only `vitals.ICU-3`.

## Why

```ts
const bed$ = route.params.pipe(map(toBed), distinctUntilChanged());

// ❌ BAD: every inner stream stays alive
bed$
  .pipe(
    mergeMap((bed) => live.frames(bed)),
    takeUntilDestroyed(),
  )
  .subscribe(showInTitle);

// ❌ WORSE: the same, written as nested subscribes. takeUntilDestroyed ends the OUTER one only,
// so the inner streams survive even when the page is left.
bed$.pipe(takeUntilDestroyed()).subscribe((bed) => live.frames(bed).subscribe(showInTitle));

// ✅ GOOD: a new bed closes the previous bed's stream
bed$
  .pipe(
    switchMap((bed) => live.frames(bed)),
    takeUntilDestroyed(),
  )
  .subscribe(showInTitle);
```

The same ✅ pattern is already in the app: `wardAlarms` in `bed-detail.ts` uses `switchMap` from
the route's ward to `alarmsStore.alarms$(ward)`.

## Pick the operator by what the new value means

| Operator     | What it does with the previous inner stream | Example in this app                                                                                                                                 |
| ------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `switchMap`  | cancels it: only the latest one matters     | route param → topic (bed, ward); search → request                                                                                                   |
| `exhaustMap` | ignores new values while one is running     | **Acknowledge**: a double click must not send two `alarms.ack` (the app disables the button while pending; `exhaustMap` does the same for a stream) |
| `concatMap`  | queues new values, one after another        | commands that must arrive in order (snooze, then ack)                                                                                               |
| `mergeMap`   | runs them all in parallel                   | only when you really want parallel work, e.g. `parseOrDrop` in `stomp-message-bus.ts`                                                               |

## Rules

- **Never `subscribe()` inside `subscribe()`.** Use a flattening operator.
- **Input that replaces the previous one** (route params, a selected id, search text) → `switchMap`.
- **Put `takeUntilDestroyed()` last in the pipe**, so it also ends the inner streams.
- **Put `catchError` inside the inner pipe.** Then one failed request doesn't kill the outer stream.
- **A reused component isn't destroyed.** Anything keyed by a route param must follow the param,
  not `route.snapshot`.
