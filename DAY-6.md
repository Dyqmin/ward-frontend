# Day 6 · Performance and memory leaks

Same Ward Monitor, now with problems planted on purpose. Each one exists twice in the code:

```ts
// ❌ BAD (M1): …what goes wrong
// ✅ GOOD (M1): …the fix
```

The **⚡ Perf** panel (bottom right) switches each topic between ❌ and ✅ and shows the numbers.

## Start

```sh
pnpm install
pnpm start              # http://localhost:4200/ward?mock   (sign in as a nurse)
```

Install **Angular DevTools** (Chrome extension). Use Chrome for the day: the Memory tools are best there.

## The ⚡ Perf panel

| Part                 | What it does                                                               |
| -------------------- | -------------------------------------------------------------------------- |
| ❌ / ✅ per topic    | switches one topic (page reloads). `?perf=bad` / `?perf=good` switches all |
| Stress ×1 / ×5 / ×10 | draws every ward N times, so costs become measurable                       |
| check counters       | yellow badge on components: how many times their template ran              |
| Template checks / s  | the same, summed per component                                             |
| Calculations / s     | how often a getter, method, `computed()` or pipe really ran                |
| Live subscriptions   | open topic subscriptions right now. `×3` on one topic = suspicious         |
| Components           | on screen vs **retained** (destroyed, still in memory after GC)            |
| Gauges               | cache sizes, JS heap                                                       |

"Retained" only means something after a garbage collection: **DevTools → Memory → 🗑**.

## The day

| #   | Topic                                                              | Where                   | Time |
| --- | ------------------------------------------------------------------ | ----------------------- | ---- |
| P0  | [Measure first](day-6/p0-measure.md)                               | tools                   | 30′  |
| P1  | [Change detection: OnPush vs Eager](day-6/p1-change-detection.md)  | nurse station           | 40′  |
| P2  | [Computation in templates](day-6/p2-template.md)                   | nurse station → tiles   | 30′  |
| P3  | [`@for` and `track`](day-6/p3-track.md)                            | active alarms           | 25′  |
| P4  | [Hot events](day-6/p4-hot-events.md)                               | bed detail → chart      | 25′  |
| P5  | [Load less: lazy routes, `@defer`, bundles](day-6/p5-load-less.md) | build                   | 40′  |
| M0  | [Finding leaks](day-6/m0-find-leaks.md)                            | tools                   | 30′  |
| M1  | [Forgotten `subscribe()`](day-6/m1-subscribe.md)                   | bed detail → tab title  | 20′  |
| M2  | [Timers and window listeners](day-6/m2-timers-listeners.md)        | bed detail → chart      | 20′  |
| M3  | [Root service keeps components](day-6/m3-root-service.md)          | alarm rows → AlarmSound | 20′  |
| M4  | [Cache that only grows](day-6/m4-cache.md)                         | tile tooltip            | 20′  |
| M5  | [`shareReplay` without `refCount`](day-6/m5-share-replay.md)       | live vitals, alarms     | 20′  |
| —   | [The hunt](day-6/hunt.md): all ❌, find everything with tools only | everywhere              | 30′  |

Keep: **[cheatsheet.md](day-6/cheatsheet.md)**: everything on one page.

## Every topic, the same way

1. **See it.** Switch the topic to ❌ and use the tool the note names.
2. **Read the ❌ code.** `grep -rn "BAD (P1)" apps/` finds it.
3. **Switch to ✅** and measure again.
4. **Remember the rule** (last line of each note).

## Files you will meet

```text
apps/ward/src/app/perf/          the panel, the modes, the counters (tooling, not a lesson)
  perf-modes.ts                  isBad('m1') — read once at startup
  perf-stats.ts                  check(), countLive(), trackInstance(), gauge()
apps/ward/src/app/**/*.eager.ts  P1: Eager twins of OnPush components
apps/ward/src/app/app.routes.eager.ts   P5: everything eager, built by `pnpm build:eager`
```
