import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { WARDS, type Ward } from '@core/messaging/contract';
import { WardPickerActions } from './ward.actions';

// ============================================================================================
//  DAY 4 · S.2 · YOUR FIRST SLICE: AN ACTION AND A REDUCER
// ============================================================================================
//  Your own slice of the Store: which ward is selected. The ward buttons will DISPATCH an action,
//  a REDUCER will keep the ward in the state, and every other tab can read it (S.3, S.4).
//  [actions] = ward.actions.ts, [feature] = ward.feature.ts, [routes] = ../state.routes.ts,
//  [ts] = this file, [html] = ward-picker.html. The NgRx functions come from '@ngrx/store'.
//  Some imports are ready at the top of each file. Whenever you use something from another file
//  (your actions, a feature, inject, Store), add its import: the editor's quick fix does it.
//
//  S.2a · the action
//   [actions] Create and export a const `WardPickerActions`: createActionGroup with the source
//          'Ward Picker' and one event, 'Ward Selected', whose props carry a `ward` (type Ward).
//          NgRx makes the action creator WardPickerActions.wardSelected from it; the type of the
//          action is "[Ward Picker] Ward Selected".
//
//  S.2b · the state and its reducer
//   [feature] Export an interface `WardState` with one field, `selected` (type Ward).
//   [feature] Create a const `initialState` (type WardState) with `selected` set to 'ICU'.
//   [feature] Create and export a const `wardFeature`: createFeature with the name 'ward' and a
//          reducer made with createReducer. It starts from initialState and has one on() for
//          WardPickerActions.wardSelected, which returns a NEW state object: a copy of the state
//          with `selected` set to the ward from the action. Give the handler the return type
//          WardState. ../s01-checklist/checklist.feature.ts is your model: same shape, other names.
//
//  S.2c · register it
//   [routes] In the route's providers, under the S.1 checklist, add provideState with wardFeature.
//   Check: reload /state. The inspector shows `ward: { selected: "ICU" }` in the state, next to
//   `checklist`, and an "@ngrx/store/update-reducers" action whose features now include "ward":
//   NgRx added your reducer.
//
//  S.2d · dispatch
//   [ts]   Inject the Store (from '@ngrx/store') into a private readonly field `store`.
//   [ts]   Create a protected method `select` with a parameter `ward` (type Ward). It dispatches
//          WardPickerActions.wardSelected with that ward.
//   [html] On click of a ward button, call select with that button's ward.
//   Check: click ER. The inspector shows "[Ward Picker] Ward Selected" with {"ward":"ER"}, and
//   `ward.selected` in the state is "ER". The buttons don't show it yet: that is S.3.
//
//  The same steps as Markdown, easier to read: ward-picker.md, next to this file.
//  Spec: pnpm nx test ward --include='**/ward-picker.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-ward-picker',
  templateUrl: './ward-picker.html',
  styleUrl: './ward-picker.scss',
})
export default class WardPicker {
  private readonly store = inject(Store);

  protected readonly wards = WARDS;

  protected select(ward: Ward): void {
    this.store.dispatch(WardPickerActions.wardSelected({ ward })); // S.2d
  }
}
