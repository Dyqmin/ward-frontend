# Comparing two approaches

"Faster" needs a definition before it needs a number. Pick **one** metric per question:

| Question                          | Metric                                           |
| --------------------------------- | ------------------------------------------------ |
| does the UI react?                | INP, or click → next paint                       |
| is the main thread blocked?       | total blocking time (TBT): Σ (long task − 50 ms) |
| does it keep up with the socket?  | messages/s processed with no long task           |
| does it stay stable over a shift? | JS heap and DOM nodes after 10 minutes           |

## How benchmarks do it (js-framework-benchmark)

- The browser is driven by a script, not by hand.
- Each case runs many times, after warm-up runs.
- Time is read from the browser's own trace (input to paint), not from `Date.now()` in your code.
- The report is a distribution, not one run.

## Do

```sh
pnpm serve:prod                  # production build, another terminal
pnpm bench main-thread           # bad vs good, 10 runs each, CPU ×4, 10 s window
pnpm bench ws-burst --stress 5 --runs 15
```

`tools/bench.mjs` uses your installed Chrome, signs in as a nurse on the mock broker, sets one topic
to ❌ or ✅ and everything else to ✅, and reports TBT and main-thread busy time (median, p90), long
task count and the longest task. Runs of the two variants alternate, so a slow minute on the laptop
hurts both equally.

## The metric must fit the shape

| Topic         | TBT ❌ / ✅     | Busy ❌ / ✅        | Why                                            |
| ------------- | --------------- | ------------------- | ---------------------------------------------- |
| `main-thread` | ~1,400 ms / 0   | ~1,800 ms / ~200 ms | a wall: long tasks, TBT sees it                |
| `ws-burst`    | ~40 ms / ~30 ms | ~6,900 / ~3,800 ms  | a picket fence: no long task, TBT sees nothing |

(CPU ×4, production build; `ws-burst` with `--stress 5`. Your numbers will differ, the pattern won't.)

TBT says `ws-burst` ❌ and ✅ are the same. They are not: the thread is busy almost twice as long.
A benchmark answers the question its metric asks, nothing more.

## Rules

- **Production build**, throttled CPU, one change at a time.
- **Median and p90**, never the average of three runs.
- If the ranges overlap, you haven't shown that one is faster.
- Check that the metric can see the problem at all: a zero on both sides is not "no difference".
- Measure in isolation (a clean app, one component) to compare techniques; measure in your app to
  decide what to fix.
