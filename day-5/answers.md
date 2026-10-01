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
