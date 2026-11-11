import { Observable, map, merge, scan, tap } from 'rxjs';

import {
  assertNever,
  type BedId,
  type MessageBus,
  type VitalsFrame,
} from '@core/messaging/contract';
import { isBad } from '@perf/perf-modes';
import { gauge } from '@perf/perf-stats';

type VitalsEvent =
  | { kind: 'snapshot'; frames: VitalsFrame[] }
  | { kind: 'frame'; frame: VitalsFrame };

/** 10 min at 1 Hz. */
export const VITALS_WINDOW = 600;

// ❌ BAD (growing-buffer): no limit. A new frame every second, kept forever: a bed left open for a
// 12 h shift holds 43,200 frames, and every new frame copies all of them. The chart only draws the
// last 600, so the screen looks fine while memory and CPU climb.
// ✅ GOOD (growing-buffer): keep only what the screen needs.
const keep = isBad('growing-buffer')
  ? (frames: VitalsFrame[]) => frames
  : (frames: VitalsFrame[]) => frames.slice(-VITALS_WINDOW);

let kept = 0;
gauge('vitals buffer · frames', () => kept);

/**
 * The last ten minutes as a snapshot, then the live stream continuing from there. It subscribes to
 * the stream FIRST, so no frame falls into the gap while the snapshot is loading.
 */
export function snapshotThenStream(
  bus: MessageBus,
  bed: BedId,
  frames$: Observable<VitalsFrame> = bus.watch(`/topic/vitals.${bed}`),
): Observable<VitalsFrame[]> {
  const snapshot$ = bus
    .request('/app/vitals.history', { bed, minutes: 10 }) // VitalsFrame[]
    .pipe(map((frames): VitalsEvent => ({ kind: 'snapshot', frames })));
  const live$ = frames$.pipe(
    map((frame): VitalsEvent => ({ kind: 'frame', frame })),
  );

  return merge(live$, snapshot$).pipe(
    scan((acc, e) => {
      switch (e.kind) {
        case 'snapshot': {
          const last = e.frames.at(-1)?.ts ?? 0;
          // keep frames that arrived early
          return keep([...e.frames, ...acc.filter((f) => f.ts > last)]);
        }
        case 'frame':
          return acc.at(-1)?.ts === e.frame.ts ? acc : keep([...acc, e.frame]);
        default:
          return assertNever(e);
      }
    }, [] as VitalsFrame[]),
    tap((frames) => (kept = frames.length)),
  );
}
