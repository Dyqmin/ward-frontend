import { gauge } from '@perf/perf-stats';
import { ALL_BEDS, type VitalsFrame } from './contract';

/**
 * Performance (ws-burst): after an outage a broker redelivers what it queued for durable
 * subscribers (ActiveMQ does this). Monitors send several readings per second, so 8 s offline is
 * thousands of messages, arriving back to back.
 */
export const BURST_SIZE = 3000;

let burstDelivered = 0;
gauge('burst · messages delivered', () => burstDelivered);

/**
 * Deliver `n` vitals frames, EACH IN ITS OWN TASK, like WebSocket `onmessage` events. (A
 * `queueMicrotask` loop would be one task, and Angular would coalesce it: not what a socket does.)
 * The frames are made here, in the browser: nothing is sent to the broker.
 */
export function deliverBurst(
  deliver: (frame: VitalsFrame) => void,
  n = BURST_SIZE,
): void {
  const channel = new MessageChannel();
  let i = 0;
  channel.port1.onmessage = () => {
    const bed = ALL_BEDS[i % ALL_BEDS.length];
    deliver({
      bed,
      ts: Date.now(),
      hr: 70 + ((i * 7) % 15),
      spo2: 95 + (i % 4),
      rr: 14 + (i % 5),
    });
    burstDelivered++;
    if (++i < n) channel.port2.postMessage(null);
    else channel.port1.close();
  };
  channel.port2.postMessage(null);
}
