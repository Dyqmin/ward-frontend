import { Service, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import {
  MessageBus,
  type BedId,
  type VitalsFrame,
} from '@core/messaging/contract';
import { isBad } from '@perf/perf-modes';

/** One shared live stream per bed, however many screens watch it. */
@Service()
export class LiveVitals {
  private readonly bus = inject(MessageBus);
  private readonly streams = new Map<BedId, Observable<VitalsFrame>>();

  frames(bed: BedId): Observable<VitalsFrame> {
    let frames$ = this.streams.get(bed);
    if (!frames$) {
      frames$ = this.bus.watch(`/topic/vitals.${bed}`).pipe(
        isBad('share-replay')
          ? // ❌ BAD (share-replay): refCount is false by default. After the first subscriber, the topic
            // subscription is NEVER closed — not when the page is left, not ever. One more live
            // stream per bed you have opened.
            shareReplay(1)
          : // ✅ GOOD (share-replay): when the last subscriber leaves, the topic subscription closes.
            shareReplay({ bufferSize: 1, refCount: true }),
      );
      this.streams.set(bed, frames$);
    }
    return frames$;
  }
}
