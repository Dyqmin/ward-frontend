# Ward Monitor

A real-time nurse station for a hospital ward — the running example for the Angular workshop
*From bootstrapApplication to Resource-Driven Routing*. Angular 22.2 (standalone, zoneless, signals,
router resources) on STOMP over WebSockets with `@stomp/rx-stomp`.

> All patients, readings and thresholds are fictional and illustrative, not clinical.

## Run it

```sh
pnpm install
pnpm start                  # http://localhost:4200
```

- **Without a backend:** open <http://localhost:4200/ward?mock>. `?mock` swaps the whole messaging
  layer (and PDF downloads) for an in-memory ward. It is remembered for the tab; `?mock=0` switches back.
- **With the backend:** start [ward-worker](https://github.com/Dyqmin/ward-worker) (`npx wrangler dev`,
  port 8787) and open <http://localhost:4200>. The app talks to `http(s)://<page host>:8787`, so the
  same build works for phones on the workshop LAN (add the origin to `ALLOWED_ORIGINS`).

| Command | What it does |
| --- | --- |
| `pnpm start` | dev server (`nx serve ward`) |
| `pnpm test` | Vitest unit tests (`nx test ward`) |
| `pnpm lint` | ESLint (`nx lint ward`) |
| `pnpm build` | production build (`nx build ward`) |

## Screens

| URL | Who | What |
| --- | --- | --- |
| `/login` | everyone | join as nurse or doctor, shared room or private sandbox |
| `/ward` | nurse | **Nurse station**: 18 live beds, active alarms with acknowledge/snooze, stale-data warnings |
| `/ward` | doctor | **Ward rounds**: escalations first, same tiles, entry to the medication wizard |
| `/ward/icu-3` | both | **Bed detail**: patient record (blocking), 10-min vitals snapshot then live stream, alarms, medication, temperatures |
| `/ward/icu-3/meds/new/…` | doctor | **Medication order wizard**: patient → drug and dose → review |
| `/ward/icu-3/temperature` | nurse | **Record temperature** (the lab) |
| `/reports/lab/icu-3` | both | PDF download with progress (`discharge` is served in mock mode only) |
| `/monitor/icu-3` | phones | **Monitor simulator** for the room game: a heart-rate slider for one bed |
| `/forbidden` | — | where the wrong role lands |

In mock mode a **Dev** toolbar (bottom left) switches role, simulates an 8 s outage, and shows every
request the fake broker received with its `commandId`.

## Where each act lives

| Act | Files |
| --- | --- |
| Day 1 contract | `shared/contract.ts` (copied **unchanged** from ward-worker), `core/messaging/contract.ts` (`MessageBus`, `FRAME_GUARDS`, `parseFrame`, `MockFixtures`, `link()`) |
| 1 – bootstrapApplication | `main.ts`, `app.config.ts`, `ward/ui/bed-tile.ts` |
| 2 – providers | `core/http/reports.ts` + `reports/reports.routes.ts` (own `HttpClient`, `withRequestsMadeViaParent`), `@Service()` everywhere, `ward/med-order/med-order-draft-store.ts` (`autoProvided: false`, route-level) |
| 3 – your own `provideX()` | `core/providers/skeleton.ts`, `core/providers/seo.ts`, `core/messaging/provide-stomp.ts`, `stomp-message-bus.ts`, `fake-message-bus.ts`, `testing/ward-fixtures.ts` |
| 4 – hospital Wi-Fi | `core/http/interceptors.ts`, `withAuthToken()` / `withExponentialReconnect()` / `withErrorLogging()`, `ward/ui/bed-tile.ts` (stale data), `core/messaging/command-retry.ts`, `ward/ui/alarm-actions.ts` |
| 5 – routing | `app.routes.ts`, `ward/ward.routes.ts`, `ward/guards.ts`, `ward/med-order/guards.ts`, `core/auth/guards.ts` (`canMatch` by role), `core/providers/wifi-aware-preloading.ts` |
| 6 – router resources | `ward/bed-detail/bed-resources.ts`, `snapshot-then-stream.ts`, `bed-detail.ts`, `core/navigation-errors.ts` |
| Lab | `ward/temperature/temperature-form.ts`, the `vitals.record` fixture, `ward/temperature/record-temperature.spec.ts` |

The lab was built in four commits (`feat(lab): step 1` … `step 4`), handy as checkpoint branches.

## Notes for the instructor

- **Resource loaders and `RedirectCommand`.** A resource wraps a thrown `RedirectCommand` in an
  `Error` (`cause`), so the router sees a navigation error, not a redirect. `handleNavigationError`
  (registered with `withNavigationErrorHandler`) unwraps it — that is what sends `/ward/icu-6` to
  `/ward?empty=ICU-6`.
- **Blocking resources arrive after construction.** They are bound to inputs by a router effect, so
  don't read them in constructor-time `toObservable()` (NG0950); read route params instead.
- **Download progress** still uses `reportProgress: true` in 22.2 (with the default fetch backend).
- **Alarm endings are silent** unless the instructor enables `emitResolved`; the app re-fetches the
  alarm snapshot on every reconnect and every 30 s. Handling `{ status: 'resolved' }` is an exercise.
- **The mock ward lives in one tab.** Two browser windows in `?mock` don't share alarms; use the real
  backend for the multi-nurse room game.
- Lab stretch goal left open: replace the last `as` in `StompMessageBus.request()` with `RPC_GUARDS`.
