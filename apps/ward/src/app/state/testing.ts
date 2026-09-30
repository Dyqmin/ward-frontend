import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActionsSubject, Store, type Action } from '@ngrx/store';
import { vi } from 'vitest';

import { AuthStore } from '@core/auth/auth-store';
import { MessageBus, type MockFixtures } from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { provideStomp, withMockBroker } from '@core/messaging/provide-stomp';
import { provideAppStore } from '@core/providers/store';
import { createWardFixtures } from '../testing/ward-fixtures';
import stateRoutes from './state.routes';

export { advance, text } from '../streams/testing';

/** Every dispatched action, as a plain object: the specs check types and data, not creators. */
export type LoggedAction = Action & Record<string, unknown>;

export interface StateTest {
  store: Store;
  bus: FakeMessageBus;
  /** Every action dispatched since the setup, oldest first. */
  actions: LoggedAction[];
  /** One slice of the state by its feature name, e.g. slice('ward'). */
  slice<T>(name: string): T | undefined;
}

/**
 * Shared by the Day 4 specs: the real Store with the providers of the /state route (so a spec sees
 * exactly what you registered there), the in-memory ward signed in as a nurse, and a fake clock.
 * `replies` replaces some of the fake broker's answers, so a spec controls what the broker says.
 */
export async function setupState(
  replies: MockFixtures['replies'] = {},
): Promise<StateTest> {
  sessionStorage.clear();
  vi.useFakeTimers();
  const fixtures = createWardFixtures();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideStomp(
        {},
        withMockBroker({
          ...fixtures,
          replies: { ...fixtures.replies, ...replies },
        }),
      ),
      provideAppStore(),
      ...stateRoutes[0].providers,
    ],
  });
  await TestBed.inject(AuthStore).join('Ann', 'nurse', 'ward-demo');

  const store = TestBed.inject(Store);
  const actions: LoggedAction[] = [];
  TestBed.inject(ActionsSubject).subscribe((a) =>
    actions.push(a as LoggedAction),
  );
  const state = store.selectSignal((s: object) => s as Record<string, unknown>);
  return {
    store,
    bus: TestBed.inject(MessageBus) as FakeMessageBus,
    actions,
    slice: <T>(name: string) => state()[name] as T | undefined,
  };
}

/** The actions of one type, e.g. ofType(test.actions, '[Ward Picker] Ward Selected'). */
export const ofType = (actions: LoggedAction[], type: string) =>
  actions.filter((a) => a.type === type);
