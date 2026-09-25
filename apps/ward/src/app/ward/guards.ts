import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';

import { bedFromSlug } from '@core/messaging/contract';

/** Yesterday's `bedFromSlug` at the URL boundary: 'icu-3' → 'ICU-3' ✅, 'icu-9' → null → back to /ward. */
export const validBed: CanActivateFn = (route) =>
  bedFromSlug(route.params['bed'] ?? '') !== null || new RedirectCommand(inject(Router).parseUrl('/ward'));
