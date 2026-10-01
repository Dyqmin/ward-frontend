# Day 4 · The NgRx global Store

Today you keep state in one place, the NgRx Store: actions that say what happened, reducers that
compute the next state, selectors that read it, and effects that talk to the broker. You build
it step by step, ending with a nurse station board that loads alarms, follows them live and
acknowledges them.

**The instructions are in the code.** Every exercise file starts with its steps: what to
build, where, and how to check it. This page only tells you where to start.

## 1. Run the app

```sh
pnpm install
pnpm start
```

`pnpm install` is needed once today: Day 4 adds `@ngrx/store`, `@ngrx/effects` and
`@ngrx/store-devtools`.

1. Open <http://localhost:4200/login>, type your name, keep the role **Nurse**, enter the room
   code the instructor gives you, and click **Join ward**. Everybody in the room shares one ward:
   you will also see the alarms your neighbours raise.
2. Click **State** in the header. Each tab is one exercise.
3. On the right: the **Store inspector**. It shows the last actions dispatched to the Store
   (newest first, with their data) and the whole state after them. Watch it after every step.
4. At the top of the page, two helpers for the checks:
   - **Test alarm**: pick a bed and click **Raise HR to 140**; within a few seconds the ward raises
     an "HR high" alarm on that bed. **Back to 72** calms it down. If the broker refuses, a message
     says why: tell the instructor. The whole room shares the ward, so for a check pick a bed
     that has no open alarm yet.
   - **Simulate outage (12 s)**: drops *your* connection to the broker for 12 seconds, then
     reconnects. Nobody else notices.

No backend? <http://localhost:4200/login?mock> runs the same app on an in-memory ward (the tests
use it too). Both helpers work there as well.

Redux DevTools (a browser extension) also works, but you don't need it.

## 2. Work through the tabs in this order

All in `apps/ward/src/app/state/`:

| Tab | Open this file | Exercises | Topic |
| --- | --- | --- | --- |
| S.1 | `s01-checklist/checklist.ts` | S.1a–c | look inside a ready-made Store feature; change one rule |
| S.2 | `s02-ward/ward-picker.ts` | S.2a–d | your first action, reducer and feature |
| S.3 | `s03-selectors/ward-overview.ts` | S.3a–d | selectors, selectSignal, createSelector |
| S.4–8 | `s04-alarms/alarms-board.ts` | S.4a–c, S.5a–b | state for a request; an effect that loads |
| | | S.6a–g | live alarms from the broker |
| | | S.7a–e | acknowledge: a command, then an event |
| | | S.8 | stretch: catch up after a reconnect |

Each tab has its own files next to it: `*.actions.ts`, `*.feature.ts` (the reducer and its
selectors) and, from S.5, `alarms.effects.ts`. They start almost empty; the steps say what goes
in. You also register your features in `state.routes.ts`.

The steps are at the top of each exercise's component, and again as Markdown next to it
(`checklist.md`, `ward-picker.md`, `ward-overview.md`, `alarms-board.md`). Same steps, easier to
read; keep your answers in the `.ts` file.

## 3. Check your work

Every exercise file names its spec. Run it after every step (it runs once, so run it again
after each change), for example:

```sh
pnpm nx test ward --include='**/ward-picker.spec.ts' --reporters=verbose
```

- Every test is named after its exercise; ✓ passes, × fails.
- Tests of later exercises are red until you get there; a few turn green early. What counts is
  that the tests of the step you just did are green.
- Two steps stop half way on purpose: after S.4 the board says "Loading alarms…" forever, and
  after S.7c "pending sync…" never goes away. The next step, an effect, finishes the job.
- If a template doesn't compile, **every** test of that file fails. Read the first error at the
  top of the output.
- The Store checks its own rules while you work. An error that says *state* or *action* is
  frozen, or not serializable, means a reducer changed the old state instead of returning a new
  object, or you put something that is not plain JSON into the Store.

## 4. Afternoon: NgRx SignalStore

Same idea, a lighter tool: one store per feature, built from blocks (`withState`, `withComputed`,
`withMethods`, `withHooks`, …). No actions, no reducers.

Click **Signal Store** in the header. All files are in `apps/ward/src/app/signal-store/`; the
steps are at the top of the file in the table.

| Tab | Open this file | Exercises | Topic |
| --- | --- | --- | --- |
| SS.1 | `ss01-my-beds/my-beds.ts` | SS.1a–e | your first store: state, a method, a computed |
| SS.2 | `ss02-alarms/alarms-page.ts` | SS.2a–e | **Lab 1**: the alarms store, `patchState` with an updater |
| SS.3 | `ss03-local/notes-page.ts` | SS.3a–c | one store for the app vs one per component; `withHooks` |
| SS.4–6 | `ss04-search/patient-search.ts` | SS.4a–e, SS.5, SS.6 | **Lab 2**: `withProps`, async load, `signalMethod`, `rxMethod` (extra) |
| SS.7–9 | `ss07-entities/alarm-board.ts` | SS.7a–c, SS.8, SS.9 | **Lab 3**: `withEntities`; extras: `withLinkedState`, your own feature |
| SS.10–12 | `ss10-live/live-alarms.ts` | SS.10a–d, SS.11a–c, SS.12a–b | **The real ward**: load, follow and acknowledge alarms over `MessageBus` |

SS.1–SS.9 run on fixed data (`signal-store-data.ts`, you don't change it). SS.10–12 talk to the
broker: the real ward, or the in-memory one with `?mock`. Run the spec named in each file, e.g.:

```sh
pnpm nx test ward --include='**/my-beds.spec.ts' --reporters=verbose
```

- Brackets confusing? Write the empty shape first — `withMethods((store) => ({ }))` — check it
  compiles, then fill it in.
- "Property … does not exist"? A block only sees the blocks above it: move it lower.
- The SS.6 test stays red after SS.5 on purpose: three keys, three requests. `rxMethod` fixes it.
