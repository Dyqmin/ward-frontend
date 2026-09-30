# S.2 · Your first slice: an action and a reducer

**Tab:** S.2 ward · **Spec:** `pnpm nx test ward --include='**/ward-picker.spec.ts' --reporters=verbose`

Your own slice of the Store: which ward is selected. The ward buttons will **dispatch** an
action, a **reducer** will keep the ward in the state, and every other tab can read it (S.3, S.4).

The NgRx functions come from `@ngrx/store`. Some imports are ready at the top of each file.
Whenever you use something from another file (your actions, a feature, `inject`, `Store`), add its
import: the editor's quick fix does it.

| Short name | File                                     |
| ---------- | ---------------------------------------- |
| [actions]  | [ward.actions.ts](ward.actions.ts)       |
| [feature]  | [ward.feature.ts](ward.feature.ts)       |
| [routes]   | [../state.routes.ts](../state.routes.ts) |
| [ts]       | [ward-picker.ts](ward-picker.ts)         |
| [html]     | [ward-picker.html](ward-picker.html)     |

## S.2a · The action

**[actions]** Create and export a const `WardPickerActions`: `createActionGroup` with the source
`'Ward Picker'` and one event, `'Ward Selected'`, whose props carry a `ward` (type `Ward`).

NgRx makes the action creator `WardPickerActions.wardSelected` from it; the type of the action is
"[Ward Picker] Ward Selected".

## S.2b · The state and its reducer

- **[feature]** Export an interface `WardState` with one field, `selected` (type `Ward`).
- **[feature]** Create a const `initialState` (type `WardState`) with `selected` set to `'ICU'`.
- **[feature]** Create and export a const `wardFeature`: `createFeature` with the name `'ward'` and
  a reducer made with `createReducer`. It starts from `initialState` and has one `on()` for
  `WardPickerActions.wardSelected`, which returns a **new** state object: a copy of the state with
  `selected` set to the ward from the action. Give the handler the return type `WardState`.
  [../s01-checklist/checklist.feature.ts](../s01-checklist/checklist.feature.ts) is your model:
  same shape, other names.

## S.2c · Register it

**[routes]** In the route's providers, under the S.1 checklist, add `provideState` with
`wardFeature`.

**Check:** reload /state. The inspector shows `ward: { selected: "ICU" }` in the state, next to
`checklist`, and an "@ngrx/store/update-reducers" action whose features now include "ward": NgRx
added your reducer.

## S.2d · Dispatch

- **[ts]** Inject the Store (from `@ngrx/store`) into a private readonly field `store`.
- **[ts]** Create a protected method `select` with a parameter `ward` (type `Ward`). It dispatches
  `WardPickerActions.wardSelected` with that ward.
- **[html]** On click of a ward button, call `select` with that button's ward.

**Check:** click ER. The inspector shows "[Ward Picker] Ward Selected" with `{"ward":"ER"}`, and
`ward.selected` in the state is "ER". The buttons don't show it yet: that is S.3.
