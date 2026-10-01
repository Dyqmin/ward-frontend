import {
  type GameNotice,
  isAlarmEvent,
  isBedId,
  isVitalsFrame,
  type StreamContract,
  type StreamDestination,
  type StreamName,
  type StreamNameOf,
} from '@wm/shared/domain';

export class FrameError extends Error {
  override readonly name = 'FrameError';
}

/** JSON.parse plus a type guard: the only way a frame body becomes a typed value. No `as T`. */
export function parseFrame<T>(body: string, guard: (x: unknown) => x is T): T {
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw new FrameError(`Frame body is not JSON: ${body.slice(0, 80)}`);
  }
  if (!guard(data))
    throw new FrameError(`Frame failed its guard: ${body.slice(0, 120)}`);
  return data;
}

/** One guard per stream. A new entry in StreamContract is a compile error here until its guard exists. */
export const FRAME_GUARDS: {
  [K in StreamName]: (x: unknown) => x is StreamContract[K]['payload'];
} = {
  vitals: isVitalsFrame,
  alarms: isAlarmEvent,
};

export const isGameNotice = (x: unknown): x is GameNotice =>
  typeof x === 'object' &&
  x !== null &&
  'kind' in x &&
  (x.kind === 'released' ||
    (x.kind === 'patient' &&
      'bed' in x &&
      typeof x.bed === 'string' &&
      isBedId(x.bed)));

/** '/topic/vitals.ICU-3' → 'vitals'. The one place the destination string is taken apart. */
export const streamNameOf = <D extends StreamDestination>(
  destination: D,
): StreamNameOf<D> =>
  destination.split('/')[2]?.split('.')[0] as StreamNameOf<D>;
