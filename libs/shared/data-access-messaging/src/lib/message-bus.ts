import { computed, signal, Signal } from '@angular/core';
import { defer, Observable } from 'rxjs';

import type {
  Command,
  GameNotice,
  GameRpcContract,
  ParticipantId,
  PayloadOf,
  RpcContract,
  StreamDestination,
} from '@wm/shared/domain';

// ---------- The full RPC surface of this app (ward + room game) ----------

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

// ---------- The MessageBus ----------

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

// ---------- Mock fixtures ----------

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
