import { Component } from '@angular/core';

import WardPicker from '../s02-ward/ward-picker';

// ============================================================================================
//  DAY 4 · S.4–8 · THE NURSE STATION ALARMS
// ============================================================================================
//  One board, built in five steps along the "request and response flow" of the NgRx Store:
//  the component only DISPATCHES what happened and READS selectors; the reducer only computes
//  the next state; an EFFECT is the only place that talks to the broker.
//  [actions] = alarms.actions.ts, [feature] = alarms.feature.ts, [effects] = alarms.effects.ts,
//  [routes] = ../state.routes.ts, [ts] = this file, [html] = alarms-board.html.
//  Ready-made: alarm-row.ts (one alarm with its Acknowledge button) and alarm-helpers.ts.
//  With ?mock, the "Test alarm" control at the top of the page raises an alarm on any bed:
//  pick a bed, click "Raise HR to 140"; "Back to 72" calms it down again.
//
//  ---------- S.4 · STATE FOR A REQUEST ----------
//  S.4a · the actions
//   [actions] Create and export a const `NurseStationActions`: createActionGroup with the source
//          'Nurse Station' and the event 'Refresh Clicked', whose props carry a `ward` (Ward).
//   [actions] Create and export a const `AlarmsApiActions`: the source 'Alarms API' and two
//          events: 'Load Success' with props `alarms` (AlarmEvent[]), and 'Load Failure' with
//          props `error` (string).
//
//  S.4b · the state and its reducer
//   [feature] Export an interface `AlarmsState`: `alarms` (AlarmEvent[]), `loading` (boolean),
//          `error` (string | null). Create a const `initialState`: no alarms, not loading, no error.
//   [feature] Create and export a const `alarmsFeature`: createFeature with the name 'alarms'
//          and a reducer with three on() handlers, each returning a copy of the state with:
//            - Refresh Clicked: `loading` true and `error` null (the old alarms stay);
//            - Load Success: the `alarms` from the action, `loading` false;
//            - Load Failure: the `error` from the action, `loading` false.
//   [routes] Add provideState with alarmsFeature to the providers.
//
//  S.4c · the board
//   [ts]   Inject the Store into a private readonly field `store`, and add AlarmRow (from
//          ./alarm-row) to the component's imports.
//   [ts]   Create protected fields with the store's selectSignal: `ward` (wardFeature.selectSelected,
//          from ../s02-ward/ward.feature), and `alarms`, `loading` and `error` (the selectors
//          createFeature made for them: alarmsFeature.selectAlarms, and so on).
//   [ts]   Create a protected method `refresh` that dispatches NurseStationActions.refreshClicked
//          with the selected ward.
//   [html] Follow the S.4c comments in the template: the button, the two lines and the list.
//   Check: click Refresh. The inspector shows "[Nurse Station] Refresh Clicked" and
//   `alarms.loading: true`, and the board says "Loading alarms…". Forever. That is right: a
//   reducer never talks to the broker, and nothing else listens to the action yet.
//
//  ---------- S.5 · AN EFFECT TALKS TO THE BROKER ----------
//  S.5a · the effect
//   [effects] Create and export a const `loadAlarms`: createEffect with two arguments:
//            1. A function with two parameters, `actions$` and `bus`, whose default values are
//               inject(Actions) and inject(MessageBus). It returns actions$ piped through:
//                 - ofType(NurseStationActions.refreshClicked): only this action goes on;
//                 - exhaustMap: each action becomes bus.request('/app/alarms.active', { ward })
//                   with the action's ward, piped through
//                     - map: the reply (the alarms) into AlarmsApiActions.loadSuccess;
//                     - catchError: the error into of(AlarmsApiActions.loadFailure) with the
//                       error's message.
//            2. The options object { functional: true }.
//          NgRx dispatches every action the effect emits. catchError sits INSIDE exhaustMap, so
//          an error ends that one request, never the effect (Day 3: catchError placement).
//
//  S.5b · register it
//   [routes] Import everything from ./s04-alarms/alarms.effects as `alarmsEffects`
//          (import * as …), and add provideEffects(alarmsEffects) (from '@ngrx/effects') to the
//          providers.
//   Check: raise a test alarm on an ICU bed, wait two seconds, click Refresh: the list, and in
//   the inspector a second action, "[Alarms API] Load Success".
//   Dev toolbar (bottom left) → "Simulate outage (8 s)", then Refresh: "[Alarms API] Load
//   Failure" and the error on the board. After the outage, Refresh works again: the effect is
//   still alive. Now click Refresh five times quickly: the dev toolbar's log shows ONE
//   alarms.active. Why one? What would mergeMap do here?
//
//  ---------- S.6 · LIVE DATA FROM THE BROKER ----------
//  The broker sends EVENTS (AlarmEvent, from the shared contract), not NgRx actions. An effect
//  turns each event into an action of ours; the reducer does the rest.
//  S.6a · the actions
//   [actions] Add two events to NurseStationActions: 'Opened' and 'Closed', both emptyProps().
//   [actions] Create and export a const `AlarmsTopicActions`: the source 'Alarms Topic' and the
//          event 'Event Received', whose props carry an `event` (AlarmEvent).
//
//  S.6b · the reducer
//   [feature] Event Received: `alarms` becomes withEvent(state.alarms, event) (ready-made in
//          ./alarm-helpers: the newest event of an alarm replaces the older one).
//   [feature] The alarms feature ALSO listens to WardPickerActions.wardSelected (import it from
//          ../s02-ward/ward.actions): a new ward starts with no alarms and no error. One action,
//          two reducers: that is how features react to each other in a Store.
//
//  S.6c · open and close
//   [ts]   In a constructor, dispatch NurseStationActions.opened(). Then register a callback
//          with inject(DestroyRef).onDestroy (DestroyRef from @angular/core) that dispatches
//          NurseStationActions.closed().
//
//  S.6d · the effect, for one ward
//   [effects] Create and export a const `liveAlarms`: createEffect like loadAlarms, with three
//          parameters: `actions$`, `store` (inject(Store)) and `bus`. It returns actions$ piped
//          through ofType(NurseStationActions.opened), then switchMap to
//          bus.watch('/topic/alarms.ICU') piped through map: each event into
//          AlarmsTopicActions.eventReceived.
//   Check: raise a test alarm on ICU-2. Within two seconds "[Alarms Topic] Event Received"
//   arrives in the inspector, and the alarm on the board. Nobody clicked Refresh.
//
//  S.6e · follow the selected ward
//   [effects] Replace the fixed ICU. Inside the outer switchMap, start from
//          store.select(wardFeature.selectSelected) (import wardFeature from
//          ../s02-ward/ward.feature) and switchMap every ward to bus.watch of its own topic,
//          `/topic/alarms.${ward}`, then map as before. switchMap stops watching the old ward
//          (Day 3, R.10).
//   Check: pick ER: the list empties. A test alarm on an ER bed appears; one on ICU does not.
//
//  S.6f · stop when the board closes
//   [effects] Pipe that inner stream (after the map) through takeUntil with actions$ piped
//          through ofType(NurseStationActions.closed).
//   Check: go to tab S.3 and raise a test alarm: no "Event Received" arrives anymore. An effect
//   lives as long as the app, not as long as the component: without takeUntil it would keep
//   listening after the board is gone (Day 3, R.2–3).
//
//  ---------- S.7 · A COMMAND, THEN AN EVENT ----------
//  S.7a · the actions
//   [actions] Add to NurseStationActions: 'Acknowledge Clicked' with props `alarmId` (AlarmId).
//   [actions] Add to AlarmsApiActions: 'Ack Accepted' with props `alarmId`, and 'Ack Rejected'
//          with props `alarmId` and `reason` (string).
//
//  S.7b · pending
//   [feature] Add `pending` (AlarmId[]) to AlarmsState, [] at start.
//          Acknowledge Clicked: add the alarmId to `pending`. Ack Accepted and Ack Rejected (one
//          on() can take several actions): remove the alarmId from `pending` (filter).
//
//  S.7c · the button
//   [ts]   Create a protected field `pending` (selectSignal of alarmsFeature.selectPending), and
//          a protected method `acknowledge` with a parameter `alarmId` (AlarmId) that dispatches
//          NurseStationActions.acknowledgeClicked with it.
//   [html] Follow the S.7c comment in the template.
//   Check: click Acknowledge: "pending sync…" appears, and stays. Again, nobody sends anything.
//
//  S.7d · the effect
//   [effects] Create and export a const `acknowledgeAlarm`: parameters `actions$` and `bus`,
//          ofType(NurseStationActions.acknowledgeClicked), then mergeMap: each action becomes
//          bus.send('/app/alarms.ack', { alarmId }) piped through
//            - commandRetry(bus) (ready-made, from Day 1);
//            - map: when the result's status is 'accepted', AlarmsApiActions.ackAccepted with the
//              alarmId, otherwise ackRejected with the alarmId and the reason reasonOf(result);
//            - catchError: into of(ackRejected) with the reason 'Broker unreachable'.
//          mergeMap, because acknowledging one alarm must never cancel another one.
//   Check: click Acknowledge: "pending sync…" goes away, and the row says "Acknowledged by …".
//   Read the inspector: that new status did NOT come from "Ack Accepted" (it only clears
//   pending). It came from "[Alarms Topic] Event Received": the broker told every screen.
//
//  S.7e · stretch: tell the nurse why
//   [effects] Create and export a const `showRejection`: a parameter `actions$`, then
//          ofType(AlarmsApiActions.ackRejected) and tap: show the action's reason with
//          inject(Toasts).show(reason, 'warn'). Options: { functional: true, dispatch: false }:
//          this effect emits no action, it only does something.
//
//  ---------- S.8 · STRETCH: CATCH UP AFTER A RECONNECT (no test) ----------
//   Events sent while the connection was down never arrive, so after an outage the board may be
//   out of date. Load the list again after every reconnect.
//   [actions] Create and export a const `BrokerActions`: the source 'Broker' and the event
//          'Reconnected' (emptyProps()).
//   [effects] Create and export a const `brokerReconnected`: a parameter `bus`; it returns
//          toObservable(bus.connected) (from @angular/core/rxjs-interop) piped through skip(1)
//          (the value at start is not a reconnect), filter(Boolean) and map to
//          BrokerActions.reconnected().
//   [effects] In loadAlarms: add a parameter `store`, also react to BrokerActions.reconnected
//          in ofType, and take the ward from the store instead of the action: after ofType,
//          withLatestFrom(store.select(wardFeature.selectSelected)), then exhaustMap over
//          [action, ward].
//   Check: "Simulate outage (8 s)". When it ends, the inspector shows "[Broker] Reconnected",
//   then "[Alarms API] Load Success", and nobody clicked Refresh.
//
//  Spec: pnpm nx test ward --include='**/alarms-board.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-alarms-board',
  imports: [WardPicker],
  templateUrl: './alarms-board.html',
  styleUrl: './alarms-board.scss',
})
export default class AlarmsBoard {}
