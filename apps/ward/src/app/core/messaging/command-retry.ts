import {
  MonoTypeOperatorFunction,
  filter,
  interval,
  race,
  retry,
  take,
  timer,
} from 'rxjs';

import type { MessageBus } from './contract';

/**
 * Retry a command with exponential back-off (500 ms → 8 s, 5 times). Safe only because `send()`
 * stamped one commandId and every retry resends that same body.
 *
 * If the broker is down when an attempt fails, the next attempt also fires as soon as the
 * connection is back — "pending sync" confirms the moment the ward reconnects, nobody touches a button.
 */
export function commandRetry<T>(
  bus: MessageBus,
  count = 5,
): MonoTypeOperatorFunction<T> {
  return retry<T>({
    count,
    delay: (_, attempt) => {
      const backoff$ = timer(Math.min(500 * 2 ** (attempt - 1), 8_000));
      if (bus.connected()) return backoff$;
      const reconnected$ = interval(250).pipe(
        filter(() => bus.connected()),
        take(1),
      );
      return race(backoff$, reconnected$);
    },
  });
}
