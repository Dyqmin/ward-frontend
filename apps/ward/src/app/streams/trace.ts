import { isDevMode } from '@angular/core';
import { tap, type MonoTypeOperatorFunction } from 'rxjs';

/**
 * Ready-made: you don't change this file. A magnifying glass for any stream: put
 * `trace('some label')` in a pipe and the console shows what happens at that point:
 *
 *   "<label> subscribe"      someone subscribed      — none? nobody subscribed, nothing runs
 *   "<label> next <value>"   a value went through    — none? the source never sent, or an
 *                                                       operator before it stopped it
 *   "<label> complete"       the stream finished
 *   "<label> error <err>"    the stream failed
 *   "<label> teardown"       the subscription ended  — none? you found a leak
 *
 * It is itself an operator: a function that returns one (here: tap). In production builds it
 * does nothing.
 *
 *   query$.pipe(trace('in'), map(f), trace('out'));
 */
export function trace<T>(label: string): MonoTypeOperatorFunction<T> {
  return isDevMode()
    ? tap({
        subscribe: () => console.log(label, 'subscribe'),
        next: (v) => console.log(label, 'next', v),
        error: (e) => console.log(label, 'error', e),
        complete: () => console.log(label, 'complete'),
        finalize: () => console.log(label, 'teardown'),
      })
    : (s$) => s$;
}
