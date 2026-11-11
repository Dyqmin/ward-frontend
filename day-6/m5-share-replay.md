# M5 · `shareReplay` without `refCount`

**Where:** `data/live-vitals.ts` and `data/alarms-store.ts`.

`shareReplay` shares one subscription to the source. With `refCount: false` — **the default** —
it never unsubscribes from the source, even when every subscriber has left.

## See it

M5 ❌. Open 5 beds, go back.

- ⚡ Perf → Live subscriptions: `vitals.ICU-1`…`ICU-5` stay `×2`; `alarms.ICU` keeps growing (×11 after 5 visits).
- Nothing is "retained" — the leak is an **open stream**: frames, network, CPU, for nothing.
- With a real broker: DevTools → Network → WS → Messages keep coming for beds nobody watches.

## Why

```ts
// ❌ BAD
watch(topic).pipe(shareReplay(1));

// ✅ GOOD
watch(topic).pipe(shareReplay({ bufferSize: 1, refCount: true }));
```

`alarms-store.ts`: this one was **really in the app** before Day 6. Found by the Perf panel's
subscription counter while preparing this workshop: `alarms.ICU ×11` after a few clicks.

## Rules

- Long-lived source (socket, interval, store) → `shareReplay({ bufferSize: 1, refCount: true })`.
- `refCount: false` only on purpose: a finite source (one HTTP call) you want to cache.
- Or skip RxJS sharing: a signal in a service is shared by nature.
