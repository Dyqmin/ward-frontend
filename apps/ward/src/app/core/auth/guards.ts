import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, RedirectCommand, Router } from '@angular/router';

import type { Role } from '../messaging/contract';
import { AuthStore } from './auth-store';

/** Not signed in → `/login`, remembering where the user wanted to go. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(AuthStore).signedIn() ||
  new RedirectCommand(inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }));

/**
 * `canMatch`, not `canActivate`: for the wrong role the route does not exist, so the router tries
 * the next one — and never downloads this route's code. v22 adds the third `currentSnapshot` param.
 * This check is for the UI only; the server still refuses commands from the wrong role.
 */
export const hasRole =
  (role: Role): CanMatchFn =>
  (_route, _segments, _currentSnapshot) =>
    inject(AuthStore).role() === role;
