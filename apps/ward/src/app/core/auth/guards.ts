import { inject } from '@angular/core';
import { CanMatchFn, RedirectCommand, Router } from '@angular/router';

import type { Role } from '../messaging/contract';
import { AuthStore } from './auth-store';

/**
 * Not signed in → `/login`, remembering where the user wanted to go. A `canMatch` guard, so it runs
 * before the role-based `canMatch` guards of the children — otherwise a signed-out user would match
 * no child and fall through to the wildcard route.
 */
export const authGuard: CanMatchFn = (_route, segments) =>
  inject(AuthStore).signedIn() ||
  new RedirectCommand(
    inject(Router).createUrlTree(['/login'], {
      queryParams: { returnUrl: '/' + segments.map((s) => s.path).join('/') },
    }),
  );

/**
 * `canMatch`, not `canActivate`: for the wrong role the route does not exist, so the router tries
 * the next one — and never downloads this route's code. v22 adds the third `currentSnapshot` param.
 * This check is for the UI only; the server still refuses commands from the wrong role.
 */
export const hasRole =
  (role: Role): CanMatchFn =>
  (_route, _segments, _currentSnapshot) =>
    inject(AuthStore).role() === role;
