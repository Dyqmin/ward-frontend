import {
  DestroyRef,
  EnvironmentProviders,
  InjectionToken,
  Injector,
  Provider,
  effect,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  untracked,
} from '@angular/core';
import { ReconnectionTimeMode, RxStomp, RxStompConfig, RxStompRPC } from '@stomp/rx-stomp';

import { AuthStore, SessionExpiredError } from '../auth/auth-store';
import { Logger } from '../logger';
import { Toasts } from '../ui/toasts';
import { MessageBus, type MockFixtures } from './contract';
import { FakeMessageBus, MOCK_FIXTURES } from './fake-message-bus';
import { StompMessageBus } from './stomp-message-bus';
import { STOMP_MODE } from './stomp-mode';

export { MOCK_FIXTURES } from './fake-message-bus';
export { STOMP_MODE } from './stomp-mode';

/** The base config handed to provideStomp(). `{room}` in brokerURL is filled in by withAuthToken(). */
export const STOMP_BASE_CONFIG = new InjectionToken<RxStompConfig>('STOMP_BASE_CONFIG');
/** Each withX() feature contributes a slice of RxStompConfig through this multi-provider. */
const STOMP_CONFIG_PARTS = new InjectionToken<Partial<RxStompConfig>[]>('STOMP_CONFIG_PARTS');
/** How the connection starts. Default: right away. withAuthToken(): only while someone is signed in. */
const STOMP_ACTIVATION = new InjectionToken<(stomp: RxStomp) => void>('STOMP_ACTIVATION', {
  factory: () => (stomp) => stomp.activate(),
});

export type StompFeatureKind = 'auth' | 'reconnect' | 'mock' | 'errors';
export interface StompFeature {
  kind: StompFeatureKind;
  providers: (Provider | EnvironmentProviders)[];
}

/**
 * Everything live in Ward Monitor, in one call:
 *
 *   provideStomp({ brokerURL }, withAuthToken(), withExponentialReconnect({ ... }))
 *
 * Factories are lazy: in mock mode `RxStomp` is never created and no socket is opened.
 */
export function provideStomp(base: RxStompConfig, ...features: StompFeature[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: STOMP_BASE_CONFIG, useValue: base },
    {
      provide: RxStomp,
      useFactory: () => {
        const parts = inject(STOMP_CONFIG_PARTS, { optional: true }) ?? [];
        const stomp = new RxStomp();
        stomp.configure(Object.assign({}, base, ...parts));
        inject(DestroyRef).onDestroy(() => void stomp.deactivate());
        inject(STOMP_ACTIVATION)(stomp);
        return stomp;
      },
    },
    {
      provide: RxStompRPC,
      useFactory: () =>
        new RxStompRPC(inject(RxStomp), {
          // ActiveMQ (and ward-worker) need an explicit reply destination per nurse station.
          // Without setupReplyQueue, RxStompRPC listens on unhandledMessage$ and never sees a reply.
          replyQueueName: `/temp-queue/station-${crypto.randomUUID()}`,
          setupReplyQueue: (queue, stomp) => stomp.watch(queue),
        }),
    },
    {
      provide: MessageBus,
      // a useFactory body is an injection context, so both classes can inject() in field initializers
      useFactory: () => (inject(STOMP_MODE) === 'mock' ? new FakeMessageBus() : new StompMessageBus()),
    },
    ...features.flatMap((f) => f.providers),
  ]);
}

/**
 * The STOMP twin of the HTTP auth interceptor. `beforeConnect` runs before EVERY (re)connect, so a
 * token that expired during a 12-hour shift is refreshed before the broker sees it. It also picks
 * the room the token opens (shared ward or sandbox) and keeps the connection up only while signed in.
 */
export function withAuthToken(): StompFeature {
  return {
    kind: 'auth',
    providers: [
      {
        provide: STOMP_CONFIG_PARTS,
        multi: true,
        useFactory: (): Partial<RxStompConfig> => {
          const auth = inject(AuthStore); // captured here, used on every (re)connect
          const base = inject(STOMP_BASE_CONFIG);
          const logger = inject(Logger);
          return {
            beforeConnect: async (stomp) => {
              const room = auth.room();
              if (!room) return void (await stomp.deactivate());
              let token: string | null;
              try {
                token = await auth.freshToken();
              } catch (e) {
                if (e instanceof SessionExpiredError) return void (await stomp.deactivate());
                // backend unreachable: try the socket anyway; a failed connect schedules the next attempt
                logger.warn('Token refresh failed, reconnecting with the current token', e);
                token = auth.token();
              }
              stomp.configure({
                brokerURL: (base.brokerURL ?? '').replace('{room}', encodeURIComponent(room)),
                connectHeaders: { Authorization: `Bearer ${token}` },
              });
            },
          };
        },
      },
      {
        provide: STOMP_ACTIVATION,
        useFactory: () => {
          const auth = inject(AuthStore);
          const injector = inject(Injector);
          return (stomp: RxStomp) => {
            let current: string | null = null;
            effect(
              () => {
                const room = auth.room();
                if (room === current) return;
                current = room;
                untracked(() => {
                  // (re)connect to the new room, or disconnect on logout
                  void stomp.deactivate().then(() => {
                    if (room && auth.room() === room) stomp.activate();
                  });
                });
              },
              { injector },
            );
          };
        },
      },
    ],
  };
}

/** Exponential back-off (stompjs 7) plus heart-beats, so a dead socket is noticed in seconds, not minutes. */
export function withExponentialReconnect(o: { initialMs: number; maxMs: number }): StompFeature {
  return {
    kind: 'reconnect',
    providers: [
      {
        provide: STOMP_CONFIG_PARTS,
        multi: true,
        useValue: {
          reconnectDelay: o.initialMs,
          reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
          maxReconnectDelay: o.maxMs,
          heartbeatOutgoing: 10_000, // the server closes sockets it has not heard from for 20 s
          heartbeatIncoming: 10_000,
          discardWebsocketOnCommFailure: true, // heart-beats stopped: drop the socket, don't wait for a close
        } satisfies Partial<RxStompConfig>,
      },
    ],
  };
}

/** Global broker-error logging, wired once at startup — the STOMP twin of errorLogInterceptor. */
export function withErrorLogging(): StompFeature {
  return {
    kind: 'errors',
    providers: [
      provideAppInitializer(() => {
        if (inject(STOMP_MODE) === 'mock') return; // don't create a socket just to log its errors
        const stomp = inject(RxStomp);
        const logger = inject(Logger);
        const toasts = inject(Toasts);
        stomp.stompErrors$.subscribe((f) => {
          logger.error('STOMP ERROR frame', f.headers['message'], f.body);
          toasts.show(`Broker error: ${f.headers['message'] ?? 'unknown'}`, 'error');
        });
        stomp.webSocketErrors$.subscribe((e) => logger.warn('WebSocket error', e));
      }),
    ],
  };
}

/** Swap the whole bus for the in-memory ward — the same switch `?mock` flips. Used by unit tests. */
export function withMockBroker(fixtures?: MockFixtures): StompFeature {
  return {
    kind: 'mock',
    providers: [
      { provide: STOMP_MODE, useValue: 'mock' },
      ...(fixtures ? [{ provide: MOCK_FIXTURES, useValue: fixtures }] : []),
    ],
  };
}
