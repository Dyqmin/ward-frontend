# shared-data-access-auth

Who is signed in: `AuthStore` (join, token refresh, role, room), the `authGuard` and `hasRole()` route guards, `provideAuth()` and the `STOMP_MODE` switch (`?mock`).

A library cannot read the app's `environment.ts`: the app passes the API URL in with `provideAuth({ apiUrl })`.

- Import path: `@wm/shared/data-access-auth`
- Tags: `scope:shared, type:data-access` (added in D5.5)
- Tests: `pnpm nx test shared-data-access-auth`
