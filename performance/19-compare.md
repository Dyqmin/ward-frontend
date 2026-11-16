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
pnpm bench ws-burst --runs 15
```

`tools/bench.mjs` uses your installed Chrome, signs in as a nurse on the mock broker, sets one topic
to ❌ or ✅ and everything else to ✅, and reports TBT (median, p90), long task count and the longest
task. Runs of the two variants alternate, so a slow minute on the laptop hurts both equally.

## Rules

- **Production build**, throttled CPU, one change at a time.
- **Median and p90**, never the average of three runs.
- If the ranges overlap, you haven't shown that one is faster.
- Measure in isolation (a clean app, one component) to compare techniques; measure in your app to
  decide what to fix.
