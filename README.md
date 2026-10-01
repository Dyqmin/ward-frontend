# Ward Monitor

A real-time nurse station for a hospital ward — the running example for the Angular workshop
_From bootstrapApplication to Resource-Driven Routing_. Angular 22.2 (standalone, zoneless, signals,
router resources) on STOMP over WebSockets with `@stomp/rx-stomp`.

> All patients, readings and thresholds are fictional and illustrative, not clinical.

## Day 5 branch

On `day-5`, participants split the app into Nx libraries by bounded context (scope) and layer
(type), add the lint rules that enforce the boundaries, and share one design system with a
second app, `pharmacy`: [DAY-5.md](DAY-5.md) says where to start, and [`day-5/`](day-5/) holds
one instruction file per step. `pnpm day5:check <step>` compares a workspace with the solution
of that step. Solutions are on `day-5-solution`; `day-5-solution-1` … `day-5-solution-9` hold
the workspace after that step.

The exercises of Days 2–4 (the Vitals card, `/streams`, `/state`) live on their own branches
(`day-2`, `day-3`, `day-4` and their `-solution` branches).

## Run it

```sh
pnpm install
pnpm start                  # http://localhost:4200
pnpm start:pharmacy         # the second app: http://localhost:4300
```

- **Without a backend:** open <http://localhost:4200/ward?mock>. `?mock` swaps the whole messaging
  layer (and PDF downloads) for an in-memory ward. It is remembered for the tab; `?mock=0` switches back.
- **With the backend:** start [ward-worker](https://github.com/Dyqmin/ward-worker) (`npx wrangler dev`,
  port 8787) and open <http://localhost:4200>. The app talks to `http(s)://<page host>:8787`, so the
  same build works for phones on the workshop LAN (add the origin to `ALLOWED_ORIGINS`).

| Command               | What it does                                                                      |
| --------------------- | --------------------------------------------------------------------------------- |
| `pnpm start`          | dev server of the ward app (`nx serve ward`)                                      |
| `pnpm start:pharmacy` | dev server of the pharmacy app (`nx serve pharmacy`, port 4300)                   |
| `pnpm test`           | Vitest unit tests of every project (`nx run-many -t test`)                        |
| `pnpm lint`           | ESLint, including the module boundaries, in every project (`nx run-many -t lint`) |
| `pnpm build`          | production build of both apps (`nx run-many -t build`)                            |
| `pnpm graph`          | the project graph (`nx graph`)                                                    |

## Screens

| URL                       | Who      | What                                                                                                                 |
| ------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `/login`                  | everyone | join as nurse or doctor, shared room or private sandbox                                                              |
| `/ward`                   | nurse    | **Nurse station**: 18 live beds, active alarms with acknowledge/snooze, stale-data warnings                          |
| `/ward`                   | doctor   | **Ward rounds**: escalations first, same tiles, entry to the medication wizard                                       |
| `/ward/icu-3`             | both     | **Bed detail**: patient record (blocking), 10-min vitals snapshot then live stream, alarms, medication, temperatures |
| `/ward/icu-3/meds/new/…`  | doctor   | **Medication order wizard**: patient → drug and dose → review                                                        |
| `/ward/icu-3/temperature` | nurse    | **Record temperature** (the lab)                                                                                     |
| `/reports/lab/icu-3`      | both     | PDF download with progress (`discharge` is served in mock mode only)                                                 |
| `/monitor/icu-3`          | phones   | **Monitor simulator** for the room game: a heart-rate slider for one bed                                             |
| `/forbidden`              | —        | where the wrong role lands                                                                                           |

In mock mode a **Dev** toolbar (bottom left) switches role, simulates an 8 s outage, and shows every
request the fake broker received with its `commandId`.

## Where each act lives

Paths start in `apps/ward/src/app/` unless they start with `libs/`.

| Act                       | Files                                                                                                                                                                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Day 1 contract            | `libs/shared/domain` (`contract.ts` copied **unchanged** from ward-worker, `ward.ts`, `links.ts` with `link()`), `libs/shared/data-access-messaging` (`message-bus.ts` with `MessageBus` and `MockFixtures`, `frames.ts` with `FRAME_GUARDS` and `parseFrame`)                           |
| 1 – bootstrapApplication  | `main.ts`, `app.config.ts`, `libs/monitoring/ui/src/lib/bed-tile/bed-tile.ts`                                                                                                                                                                                                            |
| 2 – providers             | `core/http/reports.ts` + `reports/reports.routes.ts` (own `HttpClient`, `withRequestsMadeViaParent`), `@Service()` everywhere, `libs/medication/feature-order/src/lib/med-order-draft-store.ts` (`autoProvided: false`, route-level)                                                     |
| 3 – your own `provideX()` | `core/providers/skeleton.ts`, `core/providers/seo.ts`, `libs/shared/data-access-auth` (`provideAuth()`), `libs/shared/data-access-messaging` (`provide-stomp.ts`, `stomp-message-bus.ts`, `fake-message-bus.ts`, `ward-fixtures.ts`)                                                     |
| 4 – hospital Wi-Fi        | `core/http/interceptors.ts`, `withAuthToken()` / `withExponentialReconnect()` / `withErrorLogging()` and `command-retry.ts` in `libs/shared/data-access-messaging`, `libs/monitoring/feature-station/src/lib/alarm-actions/alarm-actions.ts`                                             |
| 5 – routing               | `app.routes.ts`, `libs/monitoring/feature-station/src/lib/ward.routes.ts` and `guards.ts`, `libs/medication/feature-order/src/lib/med-order.routes.ts` and `guards.ts`, `libs/shared/data-access-auth/src/lib/guards.ts` (`canMatch` by role), `core/providers/wifi-aware-preloading.ts` |
| 6 – router resources      | `libs/monitoring/data-access/src/lib/bed-resources.ts` and `snapshot-then-stream.ts`, `libs/patient/data-access/src/lib/patient-resource.ts`, `libs/monitoring/feature-station/src/lib/bed-detail/bed-detail.ts`, `core/navigation-errors.ts`                                            |
| Lab                       | `libs/monitoring/feature-station/src/lib/temperature/temperature-form.ts` and `record-temperature.spec.ts`, the `vitals.record` fixture in `ward-fixtures.ts`                                                                                                                            |

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
