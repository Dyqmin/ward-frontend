# `shareReplay` without `refCount`

**Where:** `data/live-vitals.ts` and `data/alarms-store.ts`.

`shareReplay` shares one subscription to the source. With `refCount: false` — **the default** —
it never unsubscribes from the source, even when every subscriber has left.

## See it

Set **shareReplay** to ❌. Open 5 beds, go back.

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

`alarms-store.ts`: this one was **really in the app** before this branch. Found by the Perf panel's
subscription counter while preparing this workshop: `alarms.ICU ×11` after a few clicks.

## STOMP: one topic, one subscription

Every `watch()` in rx-stomp sends its own `SUBSCRIBE` frame. The broker then sends each message
**once per subscription** over the same socket, and the app parses each copy again
(`JSON.parse` plus the frame guard in `stomp-message-bus.ts`).

On the bed page, the chart and the tab title both need `/topic/vitals.ICU-3`. They share
`LiveVitals.frames(bed)`, so the panel shows `vitals.ICU-3`, not `×2`. If each called
`bus.watch()` itself, the socket would carry everything twice.

```ts
// ✅ live-vitals.ts: a root service hands out ONE shared stream per topic
frames(bed) {
  return this.streams.get(bed) ?? /* bus.watch(...).pipe(shareReplay({ bufferSize: 1, refCount: true })) */;
}
```

The same applies to `async` pipes and `toSignal()`. Each one subscribes again, so subscribe once
and pass the value (or the signal) down.

## Rules

- Long-lived source (socket, interval, store) → `shareReplay({ bufferSize: 1, refCount: true })`.
- `refCount: false` only on purpose: a finite source (one HTTP call) you want to cache.
- Or skip RxJS sharing: a signal in a service is shared by nature.
- Several screens on one topic? Hand out one shared stream from a root service. Don't call `watch()` per component.
