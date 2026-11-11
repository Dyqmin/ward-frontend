# Root service keeps components

**Where:** `alarm-actions.ts` constructor → `data/alarm-sound.ts`.

A root service (`@Service()`, `providedIn: 'root'`) lives as long as the app. Whatever it
stores lives that long too.

## See it

Set **Root service** to ❌. (With **@for and track** also ❌ it grows faster, because rows are re-created.). Let alarms come and go, open a bed, go back.

- ⚡ Perf gauges: **AlarmSound rows** grows; on screen there are fewer rows.
- **AlarmSound beeping for** counts alarms nobody can see — a real bug, not just memory.
- Heap snapshot → `AlarmActions` → Retainers: `Set` → `sources` → `AlarmSound`.

## Why

```ts
// ❌ BAD
sound.register(this);

// ✅ GOOD: what you register, you unregister
sound.register(this);
inject(DestroyRef).onDestroy(() => sound.unregister(this));
```

## Rules

- Don't hand `this` (a component) to something that outlives it, unless you take it back.
- Prefer the opposite direction: the service exposes **signals**, components read them.
- Same trap: arrays of callbacks, "registries", event buses, global `Subject`s you push `this` into.
