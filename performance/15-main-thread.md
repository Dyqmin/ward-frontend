# Heavy calculation on the main thread

**Where:** `ward/trends/hr-trends.ts`, `onMainThread()`. The estimator is `ward/trends/hr-trend.ts`.

The nurse station shows a heart-rate trend per bed: the slope over the last 3 minutes, computed with
Theil–Sen (the median of the slopes between every pair of points). It is robust against artefacts,
and it is O(n²): 180 points means 16,110 slopes to compute and sort. Per bed, per frame, 18 beds.

## See it

Set **Heavy calculation on the main thread** to ❌, open the nurse station, Performance → CPU ×4 →
record 5 s.

- **Flame chart:** one wide task every second, red corner. Inside: `hrTrend` → `sort`. This is the
  **wall** shape.
- **Bottom-Up**, sorted by Self Time: `hrTrend` and the sort comparator at the top.
- **Click Acknowledge** during the recording: the click waits for the wall (Interactions track).
- **⚡ Perf → Calculations/s:** `hrTrend · main thread` ≈ 18/s.

## Fix it, in this order

1. **Compute less often.** A 3-minute trend barely moves in one second. `sampleTime(10_000)` cuts the
   work 10×, with no new code. Try it first.
2. **A cheaper algorithm.** A least-squares slope can be updated in O(1) per frame (running sums).
   Less robust to artefacts: a product decision, not only a technical one.
3. **Move it off the main thread.** When 1 and 2 are not enough, or the result must stay exact.
   Set the topic to ✅: the same `hrTrend()` runs in `hr-trend.worker.ts`. The wall moves to a
   **Worker** track in the Performance panel; the main thread only posts and renders.

## Rules

- A long task is not "slow code" until you know **what** it blocks: clicks (INP), frames, messages.
- Cheapest fix first: less often, then less work, then another thread.
- A worker does not make the work faster. It makes the UI stop waiting for it.
