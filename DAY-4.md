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
     says why: tell the instructor.
   - **Simulate outage (8 s)**: drops *your* connection to the broker for 8 seconds, then
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
| | | S.6a–f | live alarms from the broker |
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
