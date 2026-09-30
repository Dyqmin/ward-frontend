# S.4–8 · The nurse station alarms

**Tab:** S.4–8 alarms · **Spec:** `pnpm nx test ward --include='**/alarms-board.spec.ts' --reporters=verbose`
(S.8 is a stretch without a test.)

One board, built in five steps along the "request and response flow" of the NgRx Store:

- the component only **dispatches** what happened and **reads** selectors;
- the reducer only computes the next state;
- an **effect** is the only place that talks to the broker.

| Short name | File                                     |
| ---------- | ---------------------------------------- |
| [actions]  | [alarms.actions.ts](alarms.actions.ts)   |
| [feature]  | [alarms.feature.ts](alarms.feature.ts)   |
| [effects]  | [alarms.effects.ts](alarms.effects.ts)   |
| [routes]   | [../state.routes.ts](../state.routes.ts) |
| [ts]       | [alarms-board.ts](alarms-board.ts)       |
| [html]     | [alarms-board.html](alarms-board.html)   |

Ready-made, you don't change them: [alarm-row.ts](alarm-row.ts) (one alarm with its Acknowledge
button) and [alarm-helpers.ts](alarm-helpers.ts).

Some imports are ready at the top of each file. Whenever you use something from another file (your
actions, a feature, `inject`, `Store`), add its import: the editor's quick fix does it.

Two helpers at the top of the page, for the checks:

- **Test alarm**: pick a bed, click **Raise HR to 140**: within a few seconds the ward raises
  "HR high" on it; **Back to 72** calms it down. If the broker refuses, a message says why. You
  share the ward with the whole room: for a check, pick a bed that has no open alarm on the board
  yet.
- **Simulate outage (12 s)**: drops _your_ connection to the broker for 12 seconds, then
  reconnects. Nobody else notices.

---

## S.4 · State for a request

### S.4a · The actions

- **[actions]** Create and export a const `NurseStationActions`: `createActionGroup` with the
  source `'Nurse Station'` and the event `'Refresh Clicked'`, whose props carry a `ward` (`Ward`).
- **[actions]** Create and export a const `AlarmsApiActions`: the source `'Alarms API'` and two
  events: `'Load Success'` with props `alarms` (`AlarmEvent[]`), and `'Load Failure'` with props
  `error` (`string`).

### S.4b · The state and its reducer

- **[feature]** Export an interface `AlarmsState`: `alarms` (`AlarmEvent[]`), `loading`
  (`boolean`), `error` (`string | null`). Create a const `initialState`: no alarms, not loading,
  no error.
- **[feature]** Create and export a const `alarmsFeature`: `createFeature` with the name
  `'alarms'` and a reducer with three `on()` handlers, each returning a copy of the state with:
  - Refresh Clicked: `loading` true and `error` null (the old alarms stay);
  - Load Success: the `alarms` from the action, `loading` false, `error` null;
  - Load Failure: the `error` from the action, `loading` false.

  [../s02-ward/ward.feature.ts](../s02-ward/ward.feature.ts) is your model.

- **[routes]** Add `provideState` with `alarmsFeature` to the providers.

### S.4c · The board

- **[ts]** Inject the Store into a private readonly field `store`, and add `AlarmRow` (from
  `./alarm-row`) to the component's imports.
- **[ts]** Create protected fields with the store's `selectSignal`: `ward`
  (`wardFeature.selectSelected`, from `../s02-ward/ward.feature`), and `alarms`, `loading` and
  `error` (the selectors `createFeature` made for them: `alarmsFeature.selectAlarms`, and so on).
- **[ts]** Create a protected method `refresh` that dispatches
  `NurseStationActions.refreshClicked` with the selected ward (an object whose `ward` is
  `ward()`).
- **[html]** Follow the S.4c comments in the template: the Refresh button, the two spans (loading
  and error), and the list **inside** the `<ul class="alarms">`.

**Check:** click Refresh. The inspector shows "[Nurse Station] Refresh Clicked" and
`alarms.loading: true`, and the board says "Loading alarms…". Forever. That is right: a reducer
never talks to the broker, and nothing else listens to the action yet.

---

## S.5 · An effect talks to the broker

An effect listens to the actions and does the side work: here, asking the broker.

- `Actions` (from `@ngrx/effects`) is an Observable of every action dispatched to the Store.
- A **functional** effect is a plain function that NgRx calls once, when the effect is
  registered. That call happens in an injection context, so `inject()` works in its parameters'
  default values.
- Whatever action the returned Observable emits, NgRx dispatches.

### S.5a · The effect

**[effects]** Create and export a const `loadAlarms`: `createEffect` with two arguments:

1. A function with two parameters, `actions$` and `bus`, whose default values are
   `inject(Actions)` and `inject(MessageBus)`. It returns `actions$` piped through:
   - `ofType(NurseStationActions.refreshClicked)`: only this action goes on;
   - `exhaustMap`: each action becomes `bus.request` to `'/app/alarms.active'` with a body whose
     `ward` is the action's ward, piped through
     - `map`: the reply into `AlarmsApiActions.loadSuccess`, with the reply as its `alarms`;
     - `catchError`: the error into `of(…)` of `AlarmsApiActions.loadFailure`, with `error` set to
       the error's message.
2. The options object with `functional` set to true.

`catchError` sits **inside** `exhaustMap`, so an error ends that one request, never the effect
(Day 3: catchError placement). Nothing happens yet: S.5b registers it.

### S.5b · Register it

**[routes]** Import everything from `./s04-alarms/alarms.effects` as one object named
`alarmsEffects` (`import * as …`: it holds every export of that file), and add
`provideEffects(alarmsEffects)` (from `@ngrx/effects`) to the providers: NgRx registers every
effect in it.

**Check** (ICU selected):

1. Raise a test alarm on a free ICU bed, wait a few seconds, click Refresh: the list, and in the
   inspector a second action, "[Alarms API] Load Success".
2. Click **Simulate outage (12 s)** and right away Refresh: within about 8 seconds
   "[Alarms API] Load Failure" and the error on the board (the request timed out). When the outage
   is over, Refresh works again: the effect is still alive.

**Think:** while a request runs, `exhaustMap` ignores new clicks (the spec checks it). What would
`mergeMap` do with five quick clicks? And `switchMap`?

---

## S.6 · Live data from the broker

The broker sends **events** (`AlarmEvent`, from the shared contract), not NgRx actions. An effect
turns each event into an action of ours; the reducer does the rest.

### S.6a · The actions

- **[actions]** Add two events to `NurseStationActions`: `'Opened'` and `'Closed'`, both
  `emptyProps()` (an action without data).
- **[actions]** Create and export a const `AlarmsTopicActions`: the source `'Alarms Topic'` and the
  event `'Event Received'`, whose props carry an `event` (`AlarmEvent`).

### S.6b · The reducer

- **[feature]** Event Received: `alarms` becomes `withEvent(state.alarms, event)` (ready-made in
  `./alarm-helpers`: the newest event of an alarm replaces the older one).
- **[feature]** The alarms feature **also** listens to `WardPickerActions.wardSelected` (import it
  from `../s02-ward/ward.actions`): a new ward starts with no alarms, no error and not loading
  (S.6g stops a request that is still running for the old ward). One action, two reducers: that is
  how features react to each other in a Store.

**Check:** click Refresh, then pick ER: the list empties, and `alarms.alarms` is `[]` in the
inspector.

### S.6c · Open and close

**[ts]** In a constructor, dispatch `NurseStationActions.opened()`. Then register a callback with
`inject(DestroyRef).onDestroy` (`DestroyRef` from `@angular/core`) that dispatches
`NurseStationActions.closed()`.

**Check:** open tab S.4–8: "[Nurse Station] Opened". Go to tab S.3: "[Nurse Station] Closed".

### S.6d · The effect, for one ward

**[effects]** Create and export a const `liveAlarms`: `createEffect` like `loadAlarms`, with three
parameters: `actions$`, `store` (`inject(Store)`; unused until S.6e) and `bus`. It returns
`actions$` piped through `ofType(NurseStationActions.opened)`, then `switchMap`: each Opened
becomes `bus.watch` of `'/topic/alarms.ICU'`, piped through `map`: each event into
`AlarmsTopicActions.eventReceived`, with the event as its `event`.

**Check:** back on tab S.4–8, raise a test alarm on a free ICU bed. Within a few seconds
"[Alarms Topic] Event Received" arrives in the inspector, and the alarm on the board. Nobody
clicked Refresh.

### S.6e · Follow the selected ward

**[effects]** `store.select` is the Observable twin of `selectSignal`. Change what your `switchMap`
returns: instead of `bus.watch` of the ICU topic, return `store.select(wardFeature.selectSelected)`
(import `wardFeature` from `../s02-ward/ward.feature`) piped through its **own** `switchMap`, which
turns each ward into `bus.watch` of `'/topic/alarms.'` plus that ward, and then the `map` from
S.6d. The inner `switchMap` stops watching the old ward when a new one is picked (Day 3, R.10).

**Check:** pick ER: the list empties. A test alarm on an ER bed appears; one on ICU does not.

### S.6f · Stop when the board closes

**[effects]** Pipe the stream that starts with `store.select(…)`, after its `switchMap` and `map`,
through `takeUntil` with `actions$` piped through `ofType(NurseStationActions.closed)`. (Not the
`bus.watch` inside it: that one only ends the current ward, and picking a ward later would start
listening again.)

**Check:** go to tab S.3, pick another ward, and raise a test alarm on a free bed of it: no
"Event Received" arrives anymore. An effect lives as long as the app, not as long as the
component: without `takeUntil` it would keep listening after the board is gone (Day 3, R.2–3).

### S.6g · A late reply for the old ward

Click Refresh on ICU and pick ER at once: the ICU reply still arrives, and ICU alarms end up in the
ER list. The request must stop when the ward changes.

**[effects]** In `loadAlarms`, pipe the request (inside `exhaustMap`, after the `catchError`)
through `takeUntil` with `actions$` piped through `ofType(WardPickerActions.wardSelected)` (import
it from `../s02-ward/ward.actions`).

**Check:** Refresh on ICU and pick ER right away: the list stays empty and "Loading alarms…" goes
away; no "[Alarms API] Load Success" arrives for ICU. Refresh on ER works as usual.

---

## S.7 · A command, then an event

### S.7a · The actions

- **[actions]** Add to `NurseStationActions`: `'Acknowledge Clicked'` with props `alarmId`
  (`AlarmId`).
- **[actions]** Add to `AlarmsApiActions`: `'Ack Accepted'` with props `alarmId` (`AlarmId`), and
  `'Ack Rejected'` with props `alarmId` (`AlarmId`) and `reason` (`string`).

### S.7b · Pending

**[feature]** Add `pending` (`AlarmId[]`) to `AlarmsState`, `[]` at start.

- Acknowledge Clicked: add the alarmId to `pending`.
- Ack Accepted and Ack Rejected (one `on()` can take several actions): remove the alarmId from
  `pending` (filter).

### S.7c · The button

- **[ts]** Create a protected field `pending` (`selectSignal` of `alarmsFeature.selectPending`),
  and a protected method `acknowledge` with a parameter `alarmId` (`AlarmId`) that dispatches
  `NurseStationActions.acknowledgeClicked` with it.
- **[html]** Follow the S.7c comment in the template.

**Check:** click Acknowledge: "pending sync…" appears, and stays. Again, nobody sends anything.

### S.7d · The effect

**[effects]** Create and export a const `acknowledgeAlarm`: parameters `actions$` and `bus`,
`ofType(NurseStationActions.acknowledgeClicked)`, then `mergeMap`: each action becomes `bus.send`
to `'/app/alarms.ack'` with a body whose `alarmId` is the action's alarmId, piped through

- `commandRetry(bus)` (ready-made, from Day 1);
- `map`: when the result's status is `'accepted'`, `AlarmsApiActions.ackAccepted` with the
  alarmId, otherwise `ackRejected` with the alarmId and the reason `reasonOf(result)`;
- `catchError`: into `of(…)` of `ackRejected` with the alarmId and the reason
  `'Broker unreachable'`.

`mergeMap`, because acknowledging one alarm must never cancel another one.

**Check:** reload the page (the stuck "pending sync…" from S.7c goes away), raise a test alarm,
click Acknowledge: "pending sync…" goes away, and the row says "Acknowledged by …". Read the
inspector: that new status did **not** come from "Ack Accepted" (it only clears pending). It came
from "[Alarms Topic] Event Received": the broker told every screen.

On the shared ward, try it with a neighbour: both acknowledge the same alarm. One of you gets
"[Alarms API] Ack Rejected" with the reason "Already handled by …".

### S.7e · Stretch: tell the nurse why

**[effects]** Create and export a const `showRejection`: a function with two parameters,
`actions$` (`inject(Actions)`) and `toasts` (`inject(Toasts)`), like `bus` in `loadAlarms`. It
returns `actions$` piped through `ofType(AlarmsApiActions.ackRejected)` and `tap`: call the show
method of `toasts` with the action's reason and `'warn'`. Options: `functional` true and
`dispatch` false: this effect emits no action, it only does something. (`inject` works only in
those default values, never inside `tap`.)

**Check:** the neighbour test from S.7d: the second nurse also sees a toast with the reason.

---

## S.8 · Stretch: catch up after a reconnect (no test)

Events sent while the connection was down never arrive, so after an outage the board may be out of
date. Load the list again after every reconnect.

- **[actions]** Create and export a const `BrokerActions`: the source `'Broker'` and the event
  `'Reconnected'` (`emptyProps()`).
- **[effects]** Create and export a const `brokerReconnected`: a function with one parameter,
  `reconnects$`, whose default value is `reconnects()` (ready-made in `./alarm-helpers`: it emits
  every time the connection comes back, not at the first connect). It returns `reconnects$` piped
  through `map` to `BrokerActions.reconnected()`.
- **[effects]** In `loadAlarms`: add a parameter `store` (`inject(Store)`), and let `ofType` take
  `BrokerActions.reconnected` too. A Reconnected action has no ward, so take the ward from the
  store: after `ofType`, `withLatestFrom(store.select(wardFeature.selectSelected))`. `exhaustMap`
  now receives a pair `[action, ward]`; only the ward is needed (you may leave the first place of
  the pair empty). Request the alarms of that ward.

**Check:** **Simulate outage (12 s)**. When it ends, the inspector shows "[Broker] Reconnected",
then "[Alarms API] Load Success", and nobody clicked Refresh.
