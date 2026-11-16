import { LOCALE_ID, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RxStomp, RxStompRPC, RxStompState } from '@stomp/rx-stomp';
import {
  Observable,
  Subject,
  filter,
  map,
  merge,
  mergeMap,
  timeout,
} from 'rxjs';

import { countLive } from '@perf/perf-stats';
import { Logger } from '../logger';
import { BURST_SIZE, deliverBurst } from './burst';
import {
  FRAME_GUARDS,
  FrameError,
  MessageBus,
  isGameNotice,
  parseFrame,
  streamNameOf,
  type ConnectionState,
  type GameNotice,
  type ParticipantId,
  type PayloadOf,
  type StreamContract,
  type StreamDestination,
  type StreamName,
  type VitalsFrame,
  type WardRpcContract,
  type WardRpcName,
} from './contract';

type AnyPayload = StreamContract[StreamName]['payload'];

/** An RPC whose reply never comes (connection dropped mid-flight) fails after this, so it can be retried. */
export const RPC_TIMEOUT_MS = 8_000;

const toConnectionState = (s: RxStompState): ConnectionState =>
  s === RxStompState.OPEN
    ? 'open'
    : s === RxStompState.CONNECTING
      ? 'connecting'
      : 'closed';

/** The real broker, via @stomp/rx-stomp. Created only when STOMP_MODE is 'real'. */
export class StompMessageBus extends MessageBus {
  private readonly stomp = inject(RxStomp);
  private readonly rpc = inject(RxStompRPC);
  private readonly logger = inject(Logger);
  private readonly locale = inject(LOCALE_ID);
  /** Performance (ws-burst): frames of a simulated redelivery, made in the browser. */
  private readonly redelivered = new Subject<VitalsFrame>();

  readonly state = toSignal(
    this.stomp.connectionState$.pipe(map(toConnectionState)),
    {
      initialValue: 'closed' as ConnectionState,
    },
  );

  /** rx-stomp re-subscribes every watch() after a reconnect, so callers never re-subscribe by hand. */
  watch<D extends StreamDestination>(destination: D): Observable<PayloadOf<D>> {
    const guard: (x: unknown) => x is AnyPayload =
      FRAME_GUARDS[streamNameOf(destination)];
    const fromBroker = this.stomp
      .watch({ destination })
      .pipe(
        mergeMap((m) =>
          this.parseOrDrop(
            destination,
            () => parseFrame(m.body, guard) as PayloadOf<D>,
          ),
        ),
      );
    const redelivered = this.redelivered.pipe(
      filter((f) => destination === `/topic/vitals.${f.bed}`),
      map((f) => f as PayloadOf<D>),
    );
    return merge(fromBroker, redelivered).pipe(
      countLive(destination), // Performance: the Perf panel counts live subscriptions
    );
  }

  /**
   * Performance (ws-burst): what a broker does after an outage, simulated in the browser. Nothing
   * is sent to the broker; `n` frames reach the subscribers of this tab, each in its own task.
   */
  burst(n = BURST_SIZE): void {
    deliverBurst((f) => this.redelivered.next(f), n);
  }

  notices(participant: ParticipantId): Observable<GameNotice> {
    const destination = `/queue/game.${participant}`;
    return this.stomp
      .watch({ destination })
      .pipe(
        mergeMap((m) =>
          this.parseOrDrop(destination, () => parseFrame(m.body, isGameNotice)),
        ),
      );
  }

  request<K extends WardRpcName>(
    destination: `/app/${K}`,
    body: WardRpcContract[K]['req'],
  ): Observable<WardRpcContract[K]['res']> {
    return this.rpc
      .rpc({
        destination,
        body: JSON.stringify(body),
        // the STOMP twin of localeInterceptor: every frame says which language the nurse reads
        headers: {
          'content-type': 'application/json',
          'accept-language': this.locale,
        },
      })
      .pipe(
        timeout(RPC_TIMEOUT_MS),
        map((m) => JSON.parse(m.body) as WardRpcContract[K]['res']), // the one unchecked boundary left – lab stretch: RPC_GUARDS
      );
  }

  // send() is inherited: idempotency lives in the contract, not in each implementation.

  /** A bad frame is logged and dropped; it never kills the subscription for every later frame. */
  private parseOrDrop<T>(destination: string, parse: () => T): T[] {
    try {
      return [parse()];
    } catch (e) {
      // Alarm endings ({ status: 'resolved' }) only arrive when the instructor enables emitResolved;
      // they are not part of the contract, and the alarm store re-fetches the snapshot instead.
      if (!(e instanceof FrameError && e.message.includes('"resolved"'))) {
        this.logger.warn(`Dropped a frame on ${destination}`, e);
      }
      return [];
    }
  }
}
