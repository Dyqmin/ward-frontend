# Day 5 · Answers

The answers to the questions at the end of each step. Compare them with yours after the step.

## D5.1 · Read the graph

- **Projects:** 8. Two apps, `ward` and `pharmacy`, and the six ready-made `shared-…` libraries.
- **Imported by the most projects:** `shared-domain`, directly by four: `ward`, `pharmacy`,
  `shared-data-access-auth` and `shared-data-access-messaging`.
- **Import no other project:** `shared-domain`, `shared-util-dates`,
  `shared-data-access-logging`, `shared-data-access-toasts`.
- **`apps/ward/src/app/ward/`:** nowhere. It is inside the `ward` box: to Nx the whole app is
  one project.
- **A change to `clock.ts`** affects `shared-util-dates` and `ward`.
- **A change to `ward.ts`** affects `shared-domain`, `shared-data-access-auth`,
  `shared-data-access-messaging`, `ward` and `pharmacy`.

1. `pharmacy` imports `shared-domain` (the `MedOrder` type in `dispensing-queue.ts`), but not
   `shared-util-dates`.
2. `shared-data-access-messaging` imports `shared-domain` itself (`frames.ts`,
   `message-bus.ts`), and also through `shared-data-access-auth`. Affected follows every arrow,
   directly or not.
3. Both. Only one project is affected, but that project is the whole app: a one-line change in
   the wizard lints, tests and builds the nurse station too. Nx cannot tell the parts of one
   project apart; libraries give it something to work with.

## D5.2 · One design system for both apps

1. The styles use the app's CSS custom properties, with a default after the comma:
   `var(--card, #ffffff)`. Each app defines its own values in its `styles.scss` (dark for the
   ward, light for the pharmacy), so one component takes the look of the app it is in. An app
   without the variables still gets a usable default.
2. `BedTile` is a monitoring word: it draws a bed of the ward and links to `/ward/<bed>`. Only the
   monitoring context needs it, with that meaning. Shared code is for what two contexts need
   with the **same** meaning (Card, Badge). A component with a domain word in its name does not
   belong in `shared`. It moves to the monitoring scope in D5.4.
3. Both teams, because `nx show projects --affected` lists both apps. Give the library one owner
   (the stretch: `CODEOWNERS`) who reviews every change with both apps in mind.

## D5.3 · The first library of the monitoring scope

1. Only `ward`: the app is the only project that uses the stores so far.
2. No. Who lies in which bed is not about monitoring vitals and alarms: the medication wizard
   needs it too. It came along because it was in the same folder. D5.9 gives it its own scope.

## D5.4 · The ward's ui folder becomes a library

1. No. `bed-tile` is presentational. `format.ts` holds the ward's alarm rules and imports a
   type, `AlarmView`, from data-access. `alarm-actions.ts` injects `MessageBus`, `AuthStore` and
   `Toasts` and sends commands: it is a container. The folder name said `ui`; the code did not.
2. Rules: tags on the projects, and a constraint saying that a `type:ui` project may not import
   a `type:data-access` one. That is D5.5.

## D5.5 · Tags and rules

The 5 errors, all in `monitoring-ui`:

- `format.ts` imports `AlarmView` from `@wm/monitoring/data-access`;
- `alarm-actions.ts` imports `AlarmView` from `@wm/monitoring/data-access`, `AuthStore` from
  `@wm/shared/data-access-auth`, `commandRetry` and `MessageBus` from
  `@wm/shared/data-access-messaging`, and `Toasts` from `@wm/shared/data-access-toasts`.

1. Two errors (`format.ts`, and one line of `alarm-actions.ts`) import the **type**
   `AlarmView`: a model, which can live where `ui` may import it. The other three import
   **services**, to do something: send a command, read the role, show a toast. Moving a type
   cannot fix those.
2. Both rules must pass. The type rule allows `type:app` → `type:ui`, but the scope rule of
   `scope:pharmacy` allows only `scope:pharmacy`, `scope:shared` and `type:api`, and
   `monitoring-ui` is `scope:monitoring`. `BedTile` is the internal UI of another team's context.
3. Its own imports would not be checked at all: no rule names it. And every tagged project that
   imported it would fail, because it has none of the tags they may import. That is why the
   generator adds the tags.

## D5.6 · A domain library

1. The rule is not about one file. Once `type:ui` may import `type:data-access`, every
   presentational component may inject stores and the broker: they would need providers in
   every test, and could no longer be used without the ward's data layer. The boundary would be
   gone for everyone.
2. No. `alarm-actions.ts` does not need a type from data-access, it needs to **act**: send
   commands with `MessageBus`, read the role from `AuthStore`, show `Toasts`. It is a container,
   so it must be split (D5.7).

## D5.7 · Container and presentational

1. `TestBed.createComponent(AlarmRow)`, then `setInput('alarm', …)`, `setInput('canAct', true)`.
   No providers at all. Clicks are checked by subscribing to the `acknowledge` and `snooze`
   outputs.
2. No. It is a container of the monitoring pages, so it goes with them into the monitoring
   feature library in D5.8. The app was a parking place for one step.

## D5.8 · The feature library

1. Its import path and the name of its routes: `import('@wm/monitoring/feature-station')`, then
   `wardRoutes`. Nothing about pages, stores or files.
2. The shell (`app.ts`), the composition (`app.config.ts`, `app.routes.ts`), the sign-in pages
   (`auth/`), the app-wide providers and shell components (`core/`), the mock toolbar (`dev/`),
   the reports and the phone simulator, and `ward/med-order/` until D5.9. Bootstrapping and
   composing belong to the app. The others are app pages outside the monitoring context; they
   could become libraries of their own later.
3. It injects `Clock` and `MessageBus` and reads the connection state and the time: it talks to
   the outside world. A `ui` library injects nothing.
