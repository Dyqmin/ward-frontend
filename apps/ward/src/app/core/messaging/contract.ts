// core/messaging/contract.ts — the Day 1 (TypeScript block) layer on top of the shared contract.
//
// `shared/contract.ts` is copied from the backend (ward-worker) and stays framework-free.
// This file adds what the Angular app builds on: the `MessageBus` abstraction, frame guards,
// mock-fixture types and type-safe links. Every act of the workshop imports from here.
//
// Each Day 1 step (roadmap at the top of shared/contract.ts) continues here in its "app layer" section.

import { Signal, computed, signal } from '@angular/core';
import { Observable, defer } from 'rxjs';

import {
  isAlarmEvent,
  isBedId,
  isVitalsFrame,
  type BedId,
  type BedSlug,
  type Command,
  type PayloadOf,
  type RpcContract,
  type StreamContract,
  type StreamDestination,
  type StreamName,
  type StreamNameOf,
  type StreamedVital,
  type Ward,
  WARDS,
  BED_NUMBERS,
} from '../../shared/contract';
import type {
  GameNotice,
  GameRpcContract,
  ParticipantId,
} from '../../shared/game-contract';

export * from '../../shared/contract';
export type {
  GameNotice,
  GameQueue,
  ParticipantId,
  ResolvedEvent,
  Role,
} from '../../shared/game-contract';

// ---------- Step 1 · app layer: literal helpers ----------

export const ALL_BEDS: readonly BedId[] = WARDS.flatMap((w) =>
  BED_NUMBERS.map((n): BedId => `${w}-${n}`),
);

export const wardOf = (bed: BedId): Ward => bed.split('-')[0] as Ward;
export const bedsOf = (ward: Ward): readonly BedId[] =>
  ALL_BEDS.filter((b) => wardOf(b) === ward);
export const toSlug = (bed: BedId): BedSlug => bed.toLowerCase() as BedSlug;

/** Illustrative thresholds, the same the server uses to raise alarms. Not clinical. */
export const THRESHOLDS: Record<
  StreamedVital,
  { low?: number; high?: number }
> = {
  hr: { low: 45, high: 130 },
  spo2: { low: 90 },
  rr: { low: 8, high: 28 },
};
export const isOutOfRange = (vital: StreamedVital, value: number): boolean => {
  const t = THRESHOLDS[vital];
  return (
    (t.low !== undefined && value < t.low) ||
    (t.high !== undefined && value > t.high)
  );
};

// ---------- Step 2 · app layer: frame guards ----------

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

// ---------- Step 3 · app layer: the full RPC surface of this app (ward + room game) ----------

export type WardRpcContract = RpcContract & GameRpcContract;
export type WardRpcName = keyof WardRpcContract;
export type WardCommandName = {
  [K in WardRpcName]: WardRpcContract[K]['req'] extends Command ? K : never;
}[WardRpcName];
/** The fields `send()` adds itself: callers never invent a commandId. */
export type CommandBody<K extends WardCommandName> = Omit<
  WardRpcContract[K]['req'],
  keyof Command
>;

// ---------- Step 4 · app layer: the MessageBus ----------

export type ConnectionState = 'connecting' | 'open' | 'closed';

/**
 * The app's only view of the broker. An abstract class is both the type and the DI token,
 * so `inject(MessageBus)` returns either `StompMessageBus` (real) or `FakeMessageBus` (?mock).
 */
export abstract class MessageBus {
  /** Typed subscription: the payload type follows from the destination string. */
  abstract watch<D extends StreamDestination>(
    destination: D,
  ): Observable<PayloadOf<D>>;

  /** Room-game notices for one participant (`/queue/game.{participantId}`). */
  abstract notices(participant: ParticipantId): Observable<GameNotice>;

  /** Request/reply: one SEND to `/app/{name}`, one typed reply. */
  abstract request<K extends WardRpcName>(
    destination: `/app/${K}`,
    body: WardRpcContract[K]['req'],
  ): Observable<WardRpcContract[K]['res']>;

  abstract readonly state: Signal<ConnectionState>;
  readonly connected: Signal<boolean> = computed(() => this.state() === 'open');

  private readonly _activeVitals = signal(0);
  /**
   * How many subscriptions to a vitals topic are open right now, with the real or the fake
   * broker (Day 3: leaks, shareReplay). It goes up on subscribe and down on unsubscribe, so a
   * leak shows as a number that only grows.
   */
  readonly activeVitals: Signal<number> = this._activeVitals.asReadonly();

  /** Implementations pass every watch() stream through here, so activeVitals stays true. */
  protected counted<T>(
    destination: StreamDestination,
    source: Observable<T>,
  ): Observable<T> {
    if (!destination.startsWith('/topic/vitals.')) return source;
    return new Observable<T>((subscriber) => {
      this._activeVitals.update((n) => n + 1);
      const inner = source.subscribe(subscriber);
      return () => {
        inner.unsubscribe();
        this._activeVitals.update((n) => n - 1);
      };
    });
  }

  /**
   * Commands: `commandId` and `performedAt` are created ONCE, here. The returned Observable is cold,
   * so a `retry()` downstream re-subscribes and resends the very same body — the server (or the
   * fake broker) answers a repeated commandId with the stored result and no second side effect.
   */
  send<K extends WardCommandName>(
    destination: `/app/${K}`,
    body: CommandBody<K>,
  ): Observable<WardRpcContract[K]['res']> {
    const command = {
      ...body,
      commandId: crypto.randomUUID(),
      performedAt: new Date().toISOString(),
    } as WardRpcContract[K]['req']; // Omit<T, keyof Command> & Command is T; TS can't prove it for a generic K
    return defer(() => this.request(destination, command));
  }
}

// ---------- Step 4 · app layer: mock fixtures ----------

export interface MockContext {
  /** Broadcast on a topic, as the server would after a command. */
  emit<D extends StreamDestination>(
    destination: D,
    payload: PayloadOf<D>,
  ): void;
  /** Who sent the request (from the session), `null` when nobody is signed in. */
  actor: ParticipantId | null;
  now: number;
}

/**
 * What the fake broker serves. A stream is either a list of frames replayed once per second
 * (timestamps are refreshed) or a function of the tick (epoch seconds). A wrong payload for a
 * destination, or a wrong reply shape for an RPC, does not compile.
 */
export type MockFixtures = {
  streams: {
    [D in StreamDestination]?:
      | readonly PayloadOf<D>[]
      | ((tick: number, ctx: MockContext) => PayloadOf<D> | null);
  };
  replies: {
    [K in WardRpcName as `/app/${K}`]?: (
      req: WardRpcContract[K]['req'],
      ctx: MockContext,
    ) => WardRpcContract[K]['res'];
  };
};

// ---------- Step 4 · app layer: type-safe links ----------

export type AppPath =
  | 'login'
  | 'forbidden'
  | 'ward'
  | 'ward/:bed'
  | 'ward/:bed/temperature'
  | 'ward/:bed/meds/new'
  | 'ward/:bed/meds/new/:step'
  | 'reports/:kind/:bed'
  | 'monitor'
  | 'monitor/:bed';

type ParamNames<P extends string> = P extends `${infer Head}/${infer Tail}`
  ? ParamNames<Head> | ParamNames<Tail>
  : P extends `:${infer Name}`
    ? Name
    : never;

export type RouteParams<P extends string> = { [K in ParamNames<P>]: string };

/** `link('ward/:bed', { bed: 'icu-3' })` → 'ward/icu-3'. Forget a param and it doesn't compile. */
export function link<P extends AppPath>(
  path: P,
  ...[params]: [ParamNames<P>] extends [never] ? [] : [RouteParams<P>]
): string {
  const values: Record<string, string> = params ?? {};
  return path.replace(/:(\w+)/g, (_, name: string) =>
    encodeURIComponent(values[name] ?? ''),
  );
}
