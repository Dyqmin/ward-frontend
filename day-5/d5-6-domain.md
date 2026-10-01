# D5.6 · Fix it the right way: a domain library

**25 minutes**

`format.ts` is in a `ui` library and imports `AlarmView` from data-access. A presentational
component needs that type, and data-access is the only place that has it. The fix is not to let
`ui` import `data-access` (that would drag the broker into every presentational component), but
to move the type to where both may import it: a **domain** library. Plain TypeScript: models and
business rules, no Angular, no broker.

## Steps

### The library

1. Create the library: folder `libs/monitoring/domain`, project `monitoring-domain`, tags
   `scope:monitoring,type:domain`, import path `@wm/monitoring/domain`.

### The model

2. Open `libs/monitoring/data-access/src/lib/alarms-store.ts`. Three things at its top are not
   data access: the interface `AlarmView`, the type `AlarmState` and the function `reduceAlarms`
   (state in, state out, nothing else). Create `libs/monitoring/domain/src/lib/alarm-view.ts`
   and move the three there, with their comments.
   - Export `AlarmState` too: it was private to the store, and the store still needs it.
   - `alarm-view.ts` imports the types `AlarmCode`, `AlarmEvent` and `AlarmId` from
     `@wm/shared/domain`.
   - `alarms-store.ts` imports `AlarmState`, `AlarmView` and `reduceAlarms` from
     `@wm/monitoring/domain`. Remove the imports it no longer uses.
3. A pure function gets a plain test. In `alarms-store.spec.ts`, the first test ("lets the
   newest event per alarm win") calls only `reduceAlarms`. Create `alarm-view.spec.ts` next to
   `alarm-view.ts`, with a `describe` named `reduceAlarms` that holds this test, moved from the
   store's spec. It also needs the constant `raised` from the top of the store's spec: copy it
   (the store's other tests still use it). In the store's spec, `AlarmView` now comes from
   `@wm/monitoring/domain`; remove the imports it no longer uses (`reduceAlarms`).

   Careful: the tests strip types before they run, and `pnpm nx build ward` does not compile a
   library's spec files. A wrong type import in a spec passes everything except the editor. Open
   `alarms-store.spec.ts` and make sure nothing is underlined in red.

### The rules

4. Move `libs/monitoring/ui/src/lib/format.ts` into `libs/monitoring/domain/src/lib/` and
   rename it `alarm-rules.ts`. Labels, titles, statuses, which alarm is urgent and when data is
   stale: these are the ward's rules about alarms, not formatting. Its `AlarmView` import now
   comes from `./alarm-view`.
5. In the domain's `src/index.ts`, export `alarm-rules` and `alarm-view`. In the ui library's
   `src/index.ts`, remove the `format` line.
6. Fix the imports everywhere: `AlarmView` and `reduceAlarms` no longer come from
   `@wm/monitoring/data-access`, and `ALARM_LABELS`, `STALE_AFTER_SEC`, `alarmTitle`,
   `alarmStatus`, `isUrgent` and `alarmsByBed` no longer come from `@wm/monitoring/ui`: all of
   them come from `@wm/monitoring/domain`. The editor's red squiggles, or `pnpm nx build ward`,
   show you where. Look at the spec files too: the build does not check them.

## Check

- `pnpm day5:check 6`
- `pnpm nx test monitoring-domain`: 1 test, no `TestBed`.
- `pnpm lint` still fails, but with **3 errors**, all in `alarm-actions.ts`.

## Questions

1. Why is "let `type:ui` import `type:data-access`" the wrong fix, although it is one line?
2. Can the same trick fix the 3 errors left in `alarm-actions.ts`? Look at what it does with
   `MessageBus`, `AuthStore` and `Toasts`.
