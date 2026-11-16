import { Service, inject } from '@angular/core';
import { Observable, map, merge, scan, tap } from 'rxjs';

import { ALL_BEDS, MessageBus, type BedId } from '@core/messaging/contract';
import { isBad } from '@perf/perf-modes';
import { calc, gauge } from '@perf/perf-stats';
import { LiveVitals } from '../data/live-vitals';
import { snapshotThenStream } from '../bed-detail/snapshot-then-stream';
import { TREND_WINDOW, hrTrend } from './hr-trend';
import { heldValues, setHistory } from './trend-cache';
import type { TrendReply, TrendRequest } from './trend-protocol';

export type Trends = ReadonlyMap<BedId, number>;

let workerHeld = 0;
let postedValues = 0;
gauge('trend cache · main thread values', heldValues);
gauge('trend cache · worker values', () => workerHeld);
gauge('trend · values posted to worker', () => postedValues);

/**
 * Heart-rate trends for every bed on the ward (nurse station). Three versions of the same feature:
 *
 * ❌ main-thread            Theil–Sen for 18 beds, synchronously, inside the frame callback.
 * ✅ main-thread, ❌ worker-cache   in a worker, but the main thread still keeps the history and
 *                            sends all of it every second: two caches, a big structured clone.
 * ✅ main-thread, ✅ worker-cache   the worker owns the history; main sends one snapshot, then frames.
 */
@Service()
export class HrTrends {
  private readonly bus = inject(MessageBus);
  private readonly live = inject(LiveVitals);

  /** Subscribe from a component: the work (and the worker) lives as long as the subscription. */
  trends$(): Observable<Trends> {
    return isBad('main-thread') ? this.onMainThread() : this.inWorker();
  }

  // ❌ BAD (main-thread): 18 beds × an O(n²) estimator, in the same task that delivered the frame.
  // On the flame chart: one wide "wall" every second (a long task, red corner). Clicks wait for it.
  private onMainThread(): Observable<Trends> {
    return merge(
      ...ALL_BEDS.map((bed) =>
        snapshotThenStream(this.bus, bed, this.live.frames(bed)).pipe(
          map((frames) => {
            calc('hrTrend · main thread');
            const hr = setHistory(
              bed,
              frames.map((f) => f.hr),
            );
            return [bed, hrTrend(hr)] as const;
          }),
        ),
      ),
    ).pipe(
      scan(
        (all, [bed, t]) => new Map(all).set(bed, t),
        new Map<BedId, number>(),
      ),
    );
  }

  // ✅ GOOD (main-thread): the estimator runs in a worker. Main thread: receive, post, render.
  private inWorker(): Observable<Trends> {
    return new Observable<Trends>((subscriber) => {
      const worker = new Worker(new URL('./hr-trend.worker', import.meta.url), {
        type: 'module',
      });
      const post = (msg: TrendRequest) => {
        postedValues +=
          'hr' in msg && Array.isArray(msg.hr) ? msg.hr.length : 1;
        worker.postMessage(msg);
      };

      let all = new Map<BedId, number>();
      worker.onmessage = ({ data }: MessageEvent<TrendReply>) => {
        calc('hrTrend · worker');
        workerHeld = data.workerHeld;
        all = new Map(all).set(data.bed, data.trend);
        subscriber.next(all);
      };

      const feeds = ALL_BEDS.map((bed) =>
        (isBad('worker-cache')
          ? this.wholeHistory(bed)
          : this.snapshotThenFrames(bed)
        )
          .pipe(tap(post))
          .subscribe(),
      );

      return () => {
        feeds.forEach((s) => s.unsubscribe());
        worker.terminate(); // ✅ a worker is a resource too: end it with its subscriber
      };
    });
  }

  // ❌ BAD (worker-cache): the main thread keeps every frame (snapshotThenStream holds 600), copies
  // them into ITS trend-cache too, and posts the whole history every second. The worker stores
  // another copy. Two caches, and a 180-value structured clone per bed per second on the main thread.
  private wholeHistory(bed: BedId): Observable<TrendRequest> {
    return snapshotThenStream(this.bus, bed, this.live.frames(bed)).pipe(
      map(
        (frames): TrendRequest => ({
          kind: 'all',
          bed,
          hr: setHistory(
            bed,
            frames.map((f) => f.hr),
          ),
        }),
      ),
    );
  }

  // ✅ GOOD (worker-cache): the main thread keeps nothing. One snapshot, then one number per frame.
  private snapshotThenFrames(bed: BedId): Observable<TrendRequest> {
    const snapshot$ = this.bus
      .request('/app/vitals.history', { bed, minutes: 10 })
      .pipe(
        map(
          (frames): TrendRequest => ({
            kind: 'snapshot',
            bed,
            lastTs: frames.at(-1)?.ts ?? 0,
            hr: frames.slice(-TREND_WINDOW).map((f) => f.hr),
          }),
        ),
      );
    const frames$ = this.live
      .frames(bed)
      .pipe(
        map((f): TrendRequest => ({ kind: 'frame', bed, ts: f.ts, hr: f.hr })),
      );
    return merge(frames$, snapshot$);
  }
}
