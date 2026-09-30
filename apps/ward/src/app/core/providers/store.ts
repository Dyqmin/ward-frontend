import {
  EnvironmentProviders,
  isDevMode,
  makeEnvironmentProviders,
} from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

/**
 * Day 4: the NgRx Store, registered once for the whole app. It starts empty: every feature adds
 * its own slice with provideState() in the providers of its route (see state/state.routes.ts).
 *
 * The runtime checks run in development only. They throw as soon as something breaks a Store
 * rule: state or an action mutated in place, a value that is not plain JSON (a Map, a Date, a
 * class instance), or two action creators with the same type string.
 * Redux DevTools (a browser extension) is optional: the /state page has its own inspector.
 */
export function provideAppStore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideStore(
      {},
      {
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: true,
          strictStateSerializability: true,
          strictActionSerializability: true,
          strictActionTypeUniqueness: true,
        },
      },
    ),
    provideStoreDevtools({ maxAge: 50, logOnly: !isDevMode() }),
  ]);
}
