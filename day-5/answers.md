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
