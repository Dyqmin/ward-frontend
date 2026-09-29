import { signal } from '@angular/core';
import { Observable, interval, map, take, timer } from 'rxjs';

// Ready-made sources for the Day 3 exercises. You don't change this file.

/** R.1 · Counts 1, 2, 3, 4, 5, one number per second, then completes. */
export const ticks$: Observable<number> = interval(1000).pipe(
  map((i) => i + 1),
  take(5),
);

/** R.6 · Fixed heart-rate samples, one per second, so every operator gives a known result. */
export const HR_SAMPLES = [72, 118, 75, 75, 131, 64, 64, 99] as const;
export const hrSamples$: Observable<number> = interval(1000).pipe(
  take(HR_SAMPLES.length),
  map((i) => HR_SAMPLES[i] ?? 0),
);

/** R.12 · How many acknowledge requests were sent to the "server" so far. */
export const requestsSent = signal(0);

/**
 * R.12 · A slow command: each subscription is ONE request to the server, which answers after
 * one second with "acknowledged".
 */
export function acknowledge(): Observable<string> {
  return new Observable<string>((subscriber) => {
    requestsSent.update((n) => n + 1);
    return timer(1000)
      .pipe(map(() => 'acknowledged'))
      .subscribe(subscriber);
  });
}
