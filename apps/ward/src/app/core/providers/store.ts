import {
  EnvironmentProviders,
  Service,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
} from '@angular/core';
import { ActionsSubject, provideStore } from '@ngrx/store';
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
    // start recording at bootstrap, so the inspector also shows the actions from before it opened
    provideEnvironmentInitializer(() => void inject(ActionLog)),
  ]);
}

export interface LoggedAction {
  n: number;
  type: string;
  /** The action's data without its type, as JSON; '' when it carries none. */
  payload: string;
  /** NgRx's own bookkeeping, e.g. "@ngrx/store/update-reducers". */
  internal: boolean;
}

/** The last actions dispatched since the app started, newest first. Read by the Store inspector. */
@Service()
export class ActionLog {
  private count = 0;
  private readonly _entries = signal<readonly LoggedAction[]>([]);
  readonly entries = this._entries.asReadonly();

  constructor() {
    // a root service lives as long as the app, so this subscription needs no cleanup
    inject(ActionsSubject).subscribe(({ type, ...data }) => {
      const logged: LoggedAction = {
        n: ++this.count,
        type,
        payload: Object.keys(data).length ? JSON.stringify(data) : '',
        internal: type.startsWith('@ngrx/'),
      };
      this._entries.update((all) => [logged, ...all].slice(0, 12));
    });
  }
}
