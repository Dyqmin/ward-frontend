import type { BedId } from '@core/messaging/contract';

/** Main thread → worker. */
export type TrendRequest =
  /** ✅ once per bed: the history, then only new frames */
  | { kind: 'snapshot'; bed: BedId; lastTs: number; hr: number[] }
  | { kind: 'frame'; bed: BedId; ts: number; hr: number }
  /** ❌ worker-cache: the whole history, every second, structured-cloned across */
  | { kind: 'all'; bed: BedId; hr: number[] };

/** Worker → main thread. */
export interface TrendReply {
  bed: BedId;
  trend: number;
  /** values held in the worker's copy of the cache */
  workerHeld: number;
}
