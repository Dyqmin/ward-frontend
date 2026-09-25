import { inject } from '@angular/core';
import {
  CanActivateFn,
  CanDeactivateFn,
  RedirectCommand,
  Router,
} from '@angular/router';

import { bedFromSlug } from '@core/messaging/contract';

/** Yesterday's `bedFromSlug` at the URL boundary: 'icu-3' → 'ICU-3' ✅, 'icu-9' → null → back to /ward. */
export const validBed: CanActivateFn = (route) =>
  bedFromSlug(route.params['bed'] ?? '') !== null ||
  new RedirectCommand(inject(Router).parseUrl('/ward'));

/**
 * A typed but unsent value asks before leaving. Typed structurally, so ward.routes.ts does not
 * import the form component — its chunk stays lazy (and is never requested by doctors).
 */
export const unsentValueGuard: CanDeactivateFn<{ dirty(): boolean }> = (form) =>
  !form.dirty() || confirm('Discard the value you typed but did not save?');
