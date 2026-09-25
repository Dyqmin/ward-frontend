import { Observable, map, merge, scan } from 'rxjs';

import { assertNever, type BedId, type MessageBus, type VitalsFrame } from '@core/messaging/contract';

type VitalsEvent = { kind: 'snapshot'; frames: VitalsFrame[] } | { kind: 'frame'; frame: VitalsFrame };

/** 10 min at 1 Hz. */
export const VITALS_WINDOW = 600;

/**
 * The last ten minutes as a snapshot, then the live stream continuing from there. It subscribes to
 * the stream FIRST, so no frame falls into the gap while the snapshot is loading.
 */
export function snapshotThenStream(bus: MessageBus, bed: BedId): Observable<VitalsFrame[]> {
  const snapshot$ = bus
    .request('/app/vitals.history', { bed, minutes: 10 }) // VitalsFrame[]
    .pipe(map((frames): VitalsEvent => ({ kind: 'snapshot', frames })));
  const live$ = bus
    .watch(`/topic/vitals.${bed}`) // VitalsFrame, no <T>
    .pipe(map((frame): VitalsEvent => ({ kind: 'frame', frame })));

  return merge(live$, snapshot$).pipe(
    scan((acc, e) => {
      switch (e.kind) {
        case 'snapshot': {
          const last = e.frames.at(-1)?.ts ?? 0;
          return [...e.frames, ...acc.filter((f) => f.ts > last)].slice(-VITALS_WINDOW); // keep frames that arrived early
        }
        case 'frame':
          return acc.at(-1)?.ts === e.frame.ts ? acc : [...acc, e.frame].slice(-VITALS_WINDOW);
        default:
          return assertNever(e);
      }
    }, [] as VitalsFrame[]),
  );
}
