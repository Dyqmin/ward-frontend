import { inject } from '@angular/core';
import { NavigationError, RedirectCommand } from '@angular/router';

import { Logger } from './logger';
import { Toasts } from './ui/toasts';

/**
 * A resource loader that throws `RedirectCommand` (e.g. an empty bed) fails its resource; Angular
 * wraps non-Error values in an Error whose `cause` is the command. Unwrap it and redirect.
 * Anything else — typically a broker timeout while loading a blocking resource — becomes a toast
 * and the user stays where they were.
 */
export function handleNavigationError(
  e: NavigationError,
): RedirectCommand | void {
  const error: unknown = e.error;
  if (error instanceof RedirectCommand) return error;
  if (error instanceof Error && error.cause instanceof RedirectCommand)
    return error.cause;
  inject(Logger).error(`Navigation to ${e.url} failed`, error);
  inject(Toasts).show(
    `Could not open ${e.url}: ${error instanceof Error ? error.message : String(error)}`,
    'error',
  );
}
