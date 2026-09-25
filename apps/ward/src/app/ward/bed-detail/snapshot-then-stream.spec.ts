import { Subject, of } from 'rxjs';

import type { MessageBus, VitalsFrame } from '@core/messaging/contract';
import { snapshotThenStream } from './snapshot-then-stream';

const frame = (ts: number): VitalsFrame => ({ bed: 'ICU-3', ts, hr: 70, spo2: 97, rr: 14 });

describe('snapshotThenStream', () => {
  it('keeps live frames that arrive before the snapshot, and orders them after it', () => {
    const live = new Subject<VitalsFrame>();
    const snapshot = new Subject<VitalsFrame[]>();
    const bus = { watch: () => live, request: () => snapshot } as unknown as MessageBus;
    const seen: number[][] = [];

    snapshotThenStream(bus, 'ICU-3').subscribe((frames) => seen.push(frames.map((f) => f.ts)));
    live.next(frame(3)); // arrives while the snapshot is still loading
    snapshot.next([frame(1), frame(2)]);
    live.next(frame(4));

    expect(seen.at(-1)).toEqual([1, 2, 3, 4]);
  });

  it('drops frames the snapshot already contains', () => {
    const live = new Subject<VitalsFrame>();
    const bus = { watch: () => live, request: () => of([frame(1), frame(2)]) } as unknown as MessageBus;
    const seen: number[][] = [];
    snapshotThenStream(bus, 'ICU-3').subscribe((frames) => seen.push(frames.map((f) => f.ts)));
    live.next(frame(2));
    live.next(frame(3));
    expect(seen.at(-1)).toEqual([1, 2, 3]);
  });
});
