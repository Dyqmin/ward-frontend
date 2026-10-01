# shared-data-access-messaging

The broker: the `MessageBus` abstraction, `StompMessageBus` (rx-stomp) and `FakeMessageBus` (`?mock` and the tests), `provideStomp()` with its `withX()` features, `commandRetry()` and the mock ward fixtures.

No other library talks to rx-stomp: they all inject `MessageBus`.

- Import path: `@wm/shared/data-access-messaging`
- Tags: `scope:shared, type:data-access` (added in D5.5)
- Tests: `pnpm nx test shared-data-access-messaging`
