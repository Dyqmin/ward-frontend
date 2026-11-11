# M1 · Forgotten `subscribe()`

**Where:** `bed-detail.ts` constructor — the tab shows `♥ 82 · ICU-3`.

## See it

M1 ❌. Open 5 beds, go back to the ward.

- The tab title still changes: **`♥ 76 · ICU-5`** on the nurse station.
- ⚡ Perf: `vitals.ICU-1 ×2`, … one extra subscription per visit. **BedDetail retained: 5.**
- Heap snapshot → `BedDetail` → Retainers: `SafeSubscriber` → … → `bus.watch`.

## Why

```ts
// ❌ BAD: no end. The callback holds `this` → the component and its DOM stay alive.
frames$.subscribe((f) => this.showInTitle(f));

// ✅ GOOD: ends with the component
frames$.pipe(takeUntilDestroyed()).subscribe((f) => this.showInTitle(f));
```

Note: `.subscribe()` on an HTTP call completes by itself. A **stream** (WebSocket, `interval`,
`fromEvent`, a `Subject`, store selectors) never does.

## Rules — in order of preference

1. **Don't subscribe.** `toSignal()`, `rxResource()`, the `async` pipe end by themselves.
2. Need side effects from state? `effect()` — it is destroyed with the component.
3. Must subscribe? `takeUntilDestroyed()` (in the constructor, or pass `inject(DestroyRef)`).
