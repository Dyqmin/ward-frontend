/// <reference lib="webworker" />
import type { BedId } from '@core/messaging/contract';
import { hrTrend } from './hr-trend';
import { append, heldValues, setHistory } from './trend-cache';
import type { TrendReply, TrendRequest } from './trend-protocol';

/** Frames that arrived before their bed's snapshot: kept until the snapshot comes. */
const early = new Map<BedId, { ts: number; hr: number }[]>();
const ready = new Set<BedId>();

addEventListener('message', ({ data }: MessageEvent<TrendRequest>) => {
  let values: number[];
  switch (data.kind) {
    case 'snapshot': {
      const later = (early.get(data.bed) ?? []).filter(
        (f) => f.ts > data.lastTs,
      );
      early.delete(data.bed);
      ready.add(data.bed);
      values = setHistory(data.bed, [...data.hr, ...later.map((f) => f.hr)]);
      break;
    }
    case 'frame':
      if (!ready.has(data.bed)) {
        early.set(data.bed, [...(early.get(data.bed) ?? []), data]);
        return;
      }
      values = append(data.bed, data.hr);
      break;
    case 'all':
      // ❌ BAD (worker-cache): the main thread already holds this history and sends ALL of it.
      // The worker keeps another copy in ITS instance of trend-cache.ts.
      values = setHistory(data.bed, data.hr);
      break;
  }
  const reply: TrendReply = {
    bed: data.bed,
    trend: hrTrend(values),
    workerHeld: heldValues(),
  };
  postMessage(reply);
});
