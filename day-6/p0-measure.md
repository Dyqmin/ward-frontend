# P0 · Measure first

Guessing is how you optimize the wrong thing. Measure, change one thing, measure again.

## The tools

| Question                              | Tool                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Which components re-render, how long? | **Angular DevTools → Profiler**: record, click a bar = one change detection run                             |
| What does the main thread do?         | **Chrome → Performance**: record 5 s. Long tasks are red-cornered (> 50 ms)                                 |
| …and what is Angular doing in it?     | console: `ng.enableProfiling()`, then record: an **Angular** track appears                                  |
| Is it getting worse over time?        | **Chrome → ⋮ More tools → Performance monitor**: CPU, JS heap, DOM nodes, listeners                         |
| How big is the download?              | `pnpm build` → "Initial total". `pnpm build:stats` → [esbuild analyzer](https://esbuild.github.io/analyze/) |
| How does a user feel it?              | **Lighthouse** (production build!): LCP, INP, CLS                                                           |

## Do

1. `pnpm start`, sign in as a nurse. Open ⚡ Perf, tick **check counters**.
2. Angular DevTools → Profiler → record 5 s → stop. How many change detection runs per second? Why
   that many? _(hint: one vitals tick, one clock tick)_
3. Performance monitor: watch JS heap and DOM nodes for a minute. Flat = healthy.
4. Switch everything to ❌ (`?perf=bad`) and repeat 2–3. Write the numbers down: you will explain
   them by the end of the day.

## Rules

- Measure **production builds** for real numbers (`pnpm serve:prod`); dev mode does extra checks.
- Throttle: Performance panel → CPU ×4. Your laptop is not the ward PC.
- One change at a time.
