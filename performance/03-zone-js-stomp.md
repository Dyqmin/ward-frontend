# Zone.js apps: STOMP traffic runs change detection

**Where:** `core/messaging/provide-stomp.ts`, the `RxStomp` factory.

This app is zoneless, so there is no ❌ to switch on. **Your project may still use zone.js**,
though, and then this is often the biggest win of the whole day.

## What happens with zone.js

zone.js patches every async API: WebSocket events, `setTimeout`, `setInterval`, promises. When one
of their callbacks finishes, Angular runs change detection for the **whole app**, from the root.

A STOMP connection produces a lot of those callbacks:

| Source in this app                                  | How often                         |
| --------------------------------------------------- | --------------------------------- |
| a `MESSAGE` frame per bed (`/topic/vitals.ICU-1` …) | 18 beds × 1/s = **18 runs/s**     |
| alarm events, RPC replies (`/app/alarms.active`)    | on every event                    |
| heartbeats (stompjs `setInterval`)                  | every few seconds, even when idle |
| reconnect timers (`withExponentialReconnect`)       | while the broker is down          |

OnPush lets each run skip clean subtrees, but the run still starts from the root, 20+ times per
second, mostly for frames that no visible component reads.

## Fix 1 · go zoneless

`provideZonelessChangeDetection()`, the default for new apps since v21. Change detection then runs
only when a signal, an input, a template event or `markForCheck()` says so. This app is the result.

## Fix 2 · stay on zone.js, run STOMP outside it

```ts
// provide-stomp.ts
{
  provide: RxStomp,
  useFactory: () => {
    const zone = inject(NgZone);
    const stomp = new RxStomp();
    stomp.configure(config);
    // the socket, heartbeats and reconnect timers are created OUTSIDE the zone,
    // so their callbacks no longer trigger change detection
    zone.runOutsideAngular(() => stomp.activate());
    return stomp;
  },
}
```

The frames still have to reach the screen. **Put them into signals** (`toSignal`, `rxResource`, or
`signal.set()` in a store). Since v18, a zone app also schedules change detection when a signal
read by a template changes, even outside the zone, and only the views that read it are marked.
Without signals, call `zone.run(() => …)` only where the view must update.

Zone.js runs a callback in the zone where its listener was **added**. The socket's listener is
added in `activate()`, so wrapping `activate()` is enough. Wrapping every `subscribe()` is not
needed.

## Fix 3 · coalesce what's left

```ts
provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true });
```

Several events in the same frame (a click that bubbles, a burst of frames after a reconnect) then
share one change detection run.

## See it in your project

Angular DevTools → Profiler → record 10 s while nothing happens on screen. Every bar is one change
detection run, and its source says what started it (`setInterval`, `message`, …).

## Rules

- **Zone.js apps:** create STOMP, WebSocket and SSE clients, chart and map libraries, and polling
  timers inside `runOutsideAngular()`.
- **Bring data back through signals**, not through `zone.run()` on every message.
- **The real goal is zoneless.** OnPush plus signals everywhere is the way there.
