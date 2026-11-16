/**
 * Heart-rate trend: the Theil–Sen estimator, the median of the slopes between EVERY pair of points.
 * Robust to artefacts (a loose sensor, a cough), which is why monitoring software likes it.
 * It is also O(n²): 180 points → 16,110 slopes to compute and sort, per bed, per frame.
 *
 * Pure function, no Angular: the same code runs on the main thread (❌ main-thread) or in a worker.
 */

/** 3 minutes at 1 Hz. */
export const TREND_WINDOW = 180;

/** Slope in bpm per minute (frames arrive once per second). */
export function hrTrend(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const slopes: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      slopes.push((values[j] - values[i]) / (j - i));
    }
  }
  slopes.sort((a, b) => a - b);
  return slopes[slopes.length >> 1] * 60;
}
