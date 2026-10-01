# D5.9 · A second bounded context and a published API

**35 minutes**

The medication wizard is the last code in `apps/ward/src/app/ward/`. Ordering medication is
its own bounded context: a doctor's order means something different from the dose a nurse gives
at the bed. Its scope is **medication**.

## Steps

### The medication feature

1. Create the library: folder `libs/medication/feature-order`, project
   `medication-feature-order`, tags `scope:medication,type:feature`, import path
   `@wm/medication/feature-order`.
2. Move the content of `apps/ward/src/app/ward/med-order/` into
   `libs/medication/feature-order/src/lib/`, as it is: the four component folders
   (`med-order-wizard/`, `patient-step/`, `drug-step/`, `review-step/`) and
   `med-order.routes.ts`, `guards.ts` and `med-order-draft-store.ts`. Delete
   `apps/ward/src/app/ward/`: it is empty now. The imports between the moved files still work.
3. Rename the selectors in the moved files from `app-…` to `wm-…`.
4. In `med-order.routes.ts`, replace the default export with an exported constant
   `medOrderRoutes`. The library's `src/index.ts` exports `med-order.routes`.
5. In `app.routes.ts`, the `'ward/:bed/meds/new'` route loads `@wm/medication/feature-order` and
   returns its `medOrderRoutes`.

### Two errors on the way

6. **The shortcut.** Why should the app mount the wizard, when `ward.routes.ts` used to? Try it:
   in `libs/monitoring/feature-station/src/lib/ward.routes.ts`, add a route `':bed/meds/new'`
   whose `loadChildren` imports `@wm/medication/feature-order`. Run
   `pnpm nx lint monitoring-feature-station` and read the error: Nx prints the first rule the
   import breaks, here the type rule. Then delete that route again.
7. Run `pnpm lint`. `medication-feature-order` fails: `patient-step.ts` and `review-step.ts`
   import `PatientsStore` from `@wm/monitoring/data-access`, and medication may not see
   monitoring's internals. Moving the store into medication would break monitoring the same
   way. Who lies in which bed is a third bounded context, **patient**, used by both.

### The patient context and its published API

8. Create the library `libs/patient/data-access`: project `patient-data-access`, tags
   `scope:patient,type:data-access`, import path `@wm/patient/data-access`.
9. Move `libs/monitoring/data-access/src/lib/patients-store.ts` into
   `libs/patient/data-access/src/lib/`.
10. In `libs/monitoring/data-access/src/lib/bed-resources.ts`, the function `patientResource`
    loads a patient record. Move it, with its comment, into a new file
    `libs/patient/data-access/src/lib/patient-resource.ts`. It uses the small helper `bedOf`
    from the same file: copy `bedOf` (monitoring's other resources still use it). Add the
    imports the new file needs, and remove the ones `bed-resources.ts` no longer uses.
11. The `src/index.ts` of `patient-data-access` exports `patient-resource` and
    `patients-store`. Remove `patients-store` from the `src/index.ts` of
    `monitoring-data-access`.
12. Create the library `libs/patient/api`: project `patient-api`, tags
    `scope:patient,type:api`, import path `@wm/patient/api`. It has no files of its own: its
    `src/index.ts` re-exports exactly two things **by name** from `@wm/patient/data-access`,
    `PatientsStore` and `patientResource`. Add a comment above it: this is the patient
    context's published API, the only part of it other scopes may import.
13. Outside `libs/patient`, everything imports `PatientsStore` and `patientResource` from
    `@wm/patient/api`: in monitoring, `nurse-station.ts`, `ward-rounds.ts` and
    `ward.routes.ts`; in medication, `patient-step.ts` and `review-step.ts`.

## Check

- `pnpm day5:check 9`
- `pnpm lint` and `pnpm test` pass.
- `pnpm graph`: compare it with the target in [DAY-5.md](../DAY-5.md#2-where-you-are-going).
  Apart from the apps' arrows to their features, every arrow between two scopes ends in
  `shared-…` or in `patient-api`.
- `pnpm start`: as a doctor, order medication for a patient; the bed screen shows the patient's
  record.

## Questions

1. Lint showed the type rule for the shortcut in point 6. Which other rule forbids it too, and
   why is it a good thing that both do?
2. Monitoring and medication may import `patient-api`, but not `patient-data-access`. Which rule
   makes the difference?
3. What could the patient team change in `patient-data-access` without telling anyone?
4. `med-order.routes.ts` has its own copy of `validBed`. When would you stop copying and share
   it, and where would it go?
