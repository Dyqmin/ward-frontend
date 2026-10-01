# D5.8 · The pages become a feature library

**50 minutes · the biggest move of the day**

What is left in `apps/ward/src/app/ward/` are the pages: the nurse station, the ward rounds,
the bed screen and the temperature form, with their routes. A **feature** library owns a part
of the routes and the containers behind them, and exports its routes and nothing else. The app
only loads it.

Each file goes to the library of its layer:

- pages and containers (they inject) → `monitoring-feature-station`
- presentational children (they don't) → `monitoring-ui`
- route resources, streams and the clock → `monitoring-data-access`

## Steps

### The library and the moves

1. Create the library: folder `libs/monitoring/feature-station`, project
   `monitoring-feature-station`, tags `scope:monitoring,type:feature`, import path
   `@wm/monitoring/feature-station`.
2. Move, from `apps/ward/src/app/ward/`:

   | From                                                                                                                     | To                                                                    |
   | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
   | `ward.routes.ts`, `guards.ts`                                                                                            | `libs/monitoring/feature-station/src/lib/`                            |
   | the folders `nurse-station/`, `ward-rounds/`, `temperature/`, `alarm-actions/`                                           | `libs/monitoring/feature-station/src/lib/`                            |
   | `bed-detail/bed-detail.ts`, `.html`, `.scss`                                                                             | `libs/monitoring/feature-station/src/lib/bed-detail/`                 |
   | the folder `bed-detail/vitals/vitals-card/`                                                                              | `libs/monitoring/feature-station/src/lib/bed-detail/vitals-card/`     |
   | the folder `bed-detail/components/medication-list/`                                                                      | `libs/monitoring/feature-station/src/lib/bed-detail/medication-list/` |
   | the folders `bed-detail/components/vitals-chart/`, `bed-detail/vitals/vital-reading/`, `bed-detail/vitals/vitals-panel/` | `libs/monitoring/ui/src/lib/`                                         |
   | `bed-detail/data/bed-resources.ts`, `snapshot-then-stream.ts`, `snapshot-then-stream.spec.ts`                            | `libs/monitoring/data-access/src/lib/`                                |
   | `bed-detail/vitals/liveness.ts`                                                                                          | `libs/monitoring/data-access/src/lib/`                                |
   | `apps/ward/src/app/core/clock.ts`                                                                                        | `libs/monitoring/data-access/src/lib/`                                |

   Folders keep their spec files. Delete the folders that end up empty. Only `med-order/` is
   left in `apps/ward/src/app/ward/`: it is not monitoring (point 7).

3. Everything in `libs/monitoring` uses the `wm-` prefix: rename the selectors that still start
   with `app-` (`wm-nurse-station`, `wm-bed-detail`, `wm-vitals-card`, `wm-vitals-panel`,
   `wm-alarm-actions`, …), the tags in the templates, and the selector strings in the specs
   (`vitals-panel.spec.ts` looks for `app-vital-reading`). Search `libs/monitoring` for `app-`
   until nothing is found.

### The public APIs

4. A feature exports its routes and nothing else. In `ward.routes.ts`, replace the default
   export with an exported constant `wardRoutes` (same array, still `satisfies Routes`). The
   feature's `src/index.ts` exports `ward.routes` only.
5. The ui library's `src/index.ts` also exports `vital-reading`, `vitals-chart` and
   `vitals-panel`.
6. The data-access library's `src/index.ts` also exports `bed-resources`, `clock`, `liveness`
   and `snapshot-then-stream`.

### The medication wizard leaves the feature

7. `ward.routes.ts` still holds the medication order wizard: the route `':bed/meds/new'` with
   its children, and the redirect for nurses below it. The wizard's files stay in the app for
   now (D5.9 moves them), and a library cannot import the app. Ordering medication is a
   different bounded context anyway, so the **app** mounts it:
   1. Create `apps/ward/src/app/ward/med-order/med-order.routes.ts` with a default export: an
      array that `satisfies Routes`. Move the two wizard routes there from `ward.routes.ts`.
      In both, the path becomes `''` (the app's route provides `ward/:bed/meds/new`). The
      redirect for nurses also needs `pathMatch: 'prefix'`: Angular requires a `pathMatch` on
      an empty-path redirect. The `loadComponent` paths lose their `./med-order/`
      prefix: `./med-order-wizard/med-order-wizard`, `./patient-step/patient-step` and so on.
   2. The wizard route uses `bedTitle` and `validBed`. They stay in the monitoring feature;
      copy them (with `bedName`, which `bedTitle` uses) into `med-order.routes.ts`, with a
      comment: a few copied lines are cheaper than a dependency between two bounded contexts.
      Import what they need (`inject`, `Router`, `RedirectCommand`, `bedFromSlug`, …).
   3. Remove the wizard's imports (`stepCompleted`, `unsavedDraftGuard`, `MedOrderDraftStore`)
      from `ward.routes.ts`.
8. In `apps/ward/src/app/app.routes.ts`:
   - before the `'ward'` route, add a route with the path `'ward/:bed/meds/new'`, `canMatch`
     with `authGuard`, and `loadChildren` importing `./ward/med-order/med-order.routes`;
   - the `'ward'` route's `loadChildren` imports `@wm/monitoring/feature-station` and returns
     its `wardRoutes` (with `.then`).

### The last imports and comments

9. Two comments are no longer true. In `app.routes.ts`, the first comment says that default
   exports mean no `.then()`: the two library routes now need one. Make it say that the app's
   own pages use default exports, and the libraries export named routes. In `ward.routes.ts`,
   the comment above `bedName` gives "Drug and dose" as an example tab title: that is the
   wizard's; use "ICU-3 · Ward Monitor".
10. Fix the imports that are still broken: inside one library, relative paths; across libraries,
    the import path. Then `pnpm nx build ward` until it builds.

## Check

- `pnpm day5:check 8`
- `pnpm lint` and `pnpm test` pass.
- `pnpm start`, and click through everything:
  - as a nurse: the nurse station, a bed (vitals, chart, alarms, medication), Record temperature;
  - opening `/ward/icu-3/meds/new` as a nurse lands on "Not for your role";
  - as a doctor: the ward rounds, Order medication, the three wizard steps.

## Questions

1. What does the app know about the monitoring feature now? Look at `app.routes.ts`.
2. What is left in `apps/ward/src/app/`, and why does it belong to the app?
3. `liveness.ts` injects `Clock` and `MessageBus`. Why is it data-access and not ui?
