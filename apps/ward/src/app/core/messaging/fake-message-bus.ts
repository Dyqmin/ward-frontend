import { InjectionToken, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, Subject, defer, delay, filter, interval, map, merge, of, share, throwError, timer } from 'rxjs';

import { createWardFixtures } from '../../testing/ward-fixtures';
import { AuthStore } from '../auth/auth-store';
import {
  MessageBus,
  isCommand,
  type ConnectionState,
  type GameNotice,
  type MockContext,
  type MockFixtures,
  type ParticipantId,
  type PayloadOf,
  type StreamDestination,
  type WardRpcContract,
  type WardRpcName,
} from './contract';

export const MOCK_FIXTURES = new InjectionToken<MockFixtures>('MOCK_FIXTURES', {
  providedIn: 'root',
  factory: () => createWardFixtures(),
});

/** Simulated network latency of every request. */
export const FAKE_LATENCY_MS = 300;

export type FakeOutcome = 'handled' | 'duplicate' | 'offline' | 'no-fixture';

export interface FakeLogEntry {
  at: number;
  destination: string;
  commandId: string | null;
  outcome: FakeOutcome;
}

type Reply<K extends WardRpcName> = (req: WardRpcContract[K]['req'], ctx: MockContext) => WardRpcContract[K]['res'];

/**
 * The in-memory ward. Same API as the real broker, no socket. Used by `?mock`, the lab and unit tests.
 * It remembers commandIds: a duplicate "medication given" returns the first answer instead of
 * recording a second dose.
 */
export class FakeMessageBus extends MessageBus {
  private readonly fixtures = inject(MOCK_FIXTURES);
  private readonly auth = inject(AuthStore);
  private readonly pushed = new Subject<{ destination: StreamDestination; payload: unknown }>();
  private readonly pushedNotices = new Subject<{ to: ParticipantId; notice: GameNotice }>();
  private readonly handled = new Map<string, unknown>(); // commandId → first reply
  private readonly online = signal(true);
  private readonly _log = signal<readonly FakeLogEntry[]>([]);

  readonly state = computed<ConnectionState>(() => (this.online() ? 'open' : 'closed'));
  /** Every request the fake broker received (including refused attempts), newest last. */
  readonly log = this._log.asReadonly();

  /** One shared 1 Hz tick (epoch seconds), so every subscriber of a bed sees the same frame. */
  private readonly tick$ = interval(1000).pipe(
    map(() => Math.floor(Date.now() / 1000)),
    share(),
  );

  watch<D extends StreamDestination>(destination: D): Observable<PayloadOf<D>> {
    const seed = this.fixtures.streams[destination];
    const ticks = seed
      ? this.tick$.pipe(
          filter(() => this.online()), // the fixture only runs while the broker is "up"
          map((tick) => frameAt<D>(seed, tick, this.context())),
          filter((f): f is PayloadOf<D> => f !== null),
        )
      : EMPTY;
    const live = this.pushed.pipe(
      filter((e) => e.destination === destination),
      map((e) => e.payload as PayloadOf<D>),
    );
    return merge(ticks, live).pipe(filter(() => this.online())); // an outage is silence, like the real ward
  }

  notices(participant: ParticipantId): Observable<GameNotice> {
    return this.pushedNotices.pipe(
      filter((n) => n.to === participant),
      map((n) => n.notice),
    );
  }

  request<K extends WardRpcName>(
    destination: `/app/${K}`,
    body: WardRpcContract[K]['req'],
  ): Observable<WardRpcContract[K]['res']> {
    const reply = this.fixtures.replies[destination] as Reply<K> | undefined;
    const id = isCommand(body) ? body.commandId : null;
    return defer(() => {
      if (!this.online()) {
        this.record(destination, id, 'offline');
        return throwError(() => new Error('Broker unreachable (simulated outage)'));
      }
      if (id && this.handled.has(id)) {
        this.record(destination, id, 'duplicate');
        return of(this.handled.get(id) as WardRpcContract[K]['res']); // no second dose
      }
      if (!reply) {
        this.record(destination, id, 'no-fixture');
        return throwError(() => new Error(`No fixture for ${destination}`));
      }
      const res = reply(body, this.context());
      if (id) this.handled.set(id, res);
      this.record(destination, id, 'handled');
      return of(res);
    }).pipe(delay(FAKE_LATENCY_MS)); // feel the latency
  }

  /** Push a frame to every subscriber of a topic, as the server would. */
  emit<D extends StreamDestination>(destination: D, payload: PayloadOf<D>): void {
    this.pushed.next({ destination, payload });
  }

  notify(to: ParticipantId, notice: GameNotice): void {
    this.pushedNotices.next({ to, notice });
  }

  /** The instructor pulls the plug: no frames, every request fails, then everything comes back. */
  simulateOutage(ms: number): void {
    this.online.set(false);
    timer(ms).subscribe(() => this.online.set(true));
  }

  clearLog(): void {
    this._log.set([]);
  }

  private context(): MockContext {
    return {
      emit: (destination, payload) => queueMicrotask(() => this.emit(destination, payload)),
      actor: this.auth.participantId(),
      now: Date.now(),
    };
  }

  private record(destination: string, commandId: string | null, outcome: FakeOutcome): void {
    this._log.update((all) => [...all.slice(-49), { at: Date.now(), destination, commandId, outcome }]);
  }
}

function frameAt<D extends StreamDestination>(
  seed: NonNullable<MockFixtures['streams'][D]>,
  tick: number,
  ctx: MockContext,
): PayloadOf<D> | null {
  if (typeof seed === 'function') return seed(tick, ctx);
  if (seed.length === 0) return null;
  const frame = seed[tick % seed.length] as PayloadOf<D>;
  // replayed frames get a fresh timestamp, otherwise every tile would look stale
  return 'ts' in frame ? { ...frame, ts: tick * 1000 } : frame;
}
