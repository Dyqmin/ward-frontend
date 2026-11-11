# Performance and memory leaks

Same Ward Monitor, now with problems planted on purpose. Each one exists twice in the code:

```ts
// ❌ BAD (forgotten-subscribe): …what goes wrong
// ✅ GOOD (forgotten-subscribe): …the fix
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

| Topic                                                                       | Where                        | Time |
| --------------------------------------------------------------------------- | ---------------------------- | ---- |
| **Speed**                                                                   |                              |      |
| [Measure first](performance/01-measure.md)                                  | tools                        | 30′  |
| [Change detection: OnPush vs Eager](performance/02-change-detection.md)     | nurse station                | 40′  |
| [Computation in templates](performance/03-template-computation.md)          | nurse station → tiles, chips | 30′  |
| [`@for` and `track`](performance/04-for-track.md)                           | active alarms                | 25′  |
| [Hot events](performance/05-hot-events.md)                                  | bed detail → chart           | 25′  |
| [Load less: lazy routes, `@defer`, bundles](performance/06-lazy-loading.md) | build                        | 40′  |
| **Memory**                                                                  |                              |      |
| [Finding leaks](performance/07-find-leaks.md)                               | tools                        | 30′  |
| [Forgotten `subscribe()`](performance/08-forgotten-subscribe.md)            | bed detail → tab title       | 20′  |
| [Timers and window listeners](performance/09-listeners-timers.md)           | bed detail → chart           | 20′  |
| [Root service keeps components](performance/10-root-service.md)             | alarm rows → AlarmSound      | 20′  |
| [Live buffer that only grows](performance/11-growing-buffer.md)             | bed detail → vitals history  | 20′  |
| [`shareReplay` without `refCount`](performance/12-share-replay.md)          | live vitals, alarms          | 20′  |
| [The hunt](performance/hunt.md): all ❌, find everything with tools only    | everywhere                   | 30′  |

Keep: **[cheatsheet.md](performance/cheatsheet.md)**: everything on one page.
The full checklist, linked to the notes: **[performance/README.md](performance/README.md)**.

## Every topic, the same way

1. **See it.** Switch the topic to ❌ and use the tool the note names.
2. **Read the ❌ code.** `grep -rn "BAD (change-detection)" apps/` finds it. The tag is the topic id from `perf-modes.ts`.
3. **Switch to ✅** and measure again.
4. **Remember the rule** (last line of each note).

## Files you will meet

```text
apps/ward/src/app/perf/          the panel, the modes, the counters (tooling, not a lesson)
  perf-modes.ts                  the topics; isBad('forgotten-subscribe') — read once at startup
  perf-stats.ts                  check(), countLive(), trackInstance(), gauge()
apps/ward/src/app/**/*.eager.ts  change-detection: Eager twins of OnPush components
apps/ward/src/app/app.routes.eager.ts   lazy-loading: everything eager, built by `pnpm build:eager`
```
