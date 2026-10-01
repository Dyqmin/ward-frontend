import { Component } from '@angular/core';

import type { DemoAlarm } from '../signal-store-data';
import AlarmCounter from './alarm-counter';

// ============================================================================================
//  DAY 4 · SS.2 · LAB 1: THE ALARMS STORE
// ============================================================================================
//  Fixed alarms (DEMO_ALARMS), one store, two components: the list (this file) and the counter.
//  [store] = alarms.store.ts, [ts] = this file, [html] = alarms-page.html,
//  [counter] = alarm-counter.ts
//
//  SS.2a · the state
//   [store] Write a type `AlarmsState`: alarms (DemoAlarm[]) and onlyHigh (boolean).
//   [store] Write a const `initialState: AlarmsState`: alarms = a copy of DEMO_ALARMS, onlyHigh = false.
//   [store] Export a const `AlarmsStore`: signalStore, { providedIn: 'root' }, withState(initialState).
//   Tip: a copy of a list: [...DEMO_ALARMS]
//
//  SS.2b · show the list
//   [ts]   Inject AlarmsStore into a protected readonly field `store`. Delete `noAlarms`.
//   [html] Loop over store.alarms() instead of noAlarms.
//   Check: 5 alarms, ER-4 already acknowledged.
//
//  SS.2c · count the open ones
//   [store] withComputed with `openCount`: the number of alarms that are not acknowledged.
//   [counter] Inject the store and show store.openCount() in the <strong>.
//   Check: "Open alarms: 4".
//
//  SS.2d · acknowledge
//   [store] withMethods with acknowledge(id: string). Use the patchState updater: it gets the
//          current state and returns the change.
//   [html] On click of Acknowledge, call store.acknowledge(a.id).
//   Tip: patchState(store, (state) => ({ alarms: state.alarms.map((a) => …) }))
//        and inside: a.id === id ? { ...a, acknowledged: true } : a
//   Check: acknowledge ICU-1 → the row says "acknowledged" AND the counter says 3.
//
//  SS.2e · extra
//   [store] Add onlyHigh handling: a method toggleOnlyHigh() and a computed `visibleAlarms` (only
//          severity 'high' when onlyHigh is true, all otherwise). Also a computed `highCount`.
//   [html] On change of the checkbox call store.toggleOnlyHigh(); loop over store.visibleAlarms().
//   [counter] Show store.highCount() in the <span class="high">.
//
//  Spec: pnpm nx test ward --include='**/alarms-page.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-alarms-page',
  imports: [AlarmCounter],
  templateUrl: './alarms-page.html',
  styleUrl: './alarms-page.scss',
})
export default class AlarmsPage {
  /** SS.2b · delete me, loop over the store's alarms instead. */
  protected readonly noAlarms: DemoAlarm[] = [];
}
