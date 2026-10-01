import { Component, inject } from '@angular/core';

import { AlarmBoardStore } from './alarm-board.store';

// ============================================================================================
//  DAY 4 · SS.7–9 · LAB 3: ALARMS AS ENTITIES
// ============================================================================================
//  The alarms store from SS.2, ready-made with a plain array. Make it shorter with withEntities.
//  [store] = alarm-board.store.ts, [html] = alarm-board.html, [feature] = with-loading.ts
//  The entity helpers come from '@ngrx/signals/entities' (imports are ready).
//
//  SS.7a · entities instead of an array
//   [store] Replace withState(…) with withEntities<DemoAlarm>().
//   [store] Add withHooks (last block) whose onInit fills it:
//          patchState(store, setAllEntities([...DEMO_ALARMS])). Do the same in reload().
//
//  SS.7b · acknowledge in one line
//   [store] acknowledge(id): patchState(store, updateEntity({ id, changes: { acknowledged: true } })).
//
//  SS.7c · read the entities
//   [store] openCount counts entities() instead of alarms().
//   [html] Loop over store.entities().
//   Check: everything works like before. Count the brackets you saved in acknowledge.
//
//  SS.8 · extra: a selection that resets itself (withLinkedState)
//   [store] After withComputed: withLinkedState(({ entities }) => ({ selectedId: () => … })):
//          the id of the first alarm that is not acknowledged, or null.
//   [store] A method select(id: string) that patches selectedId.
//   [html] On click of Select call store.select(a.id); the row gets the class selected when
//          a.id === store.selectedId().
//   Tip: ?. stops on undefined, ?? gives a default: list.find(…)?.id ?? null
//   Check: ICU-1 is selected. Click ER-2. Acknowledge ER-2 → the first open alarm is selected again.
//
//  SS.9 · extra: your own block (signalStoreFeature)
//   [feature] Export function withLoading(): it returns signalStoreFeature(withState({ loading: false }),
//          withMethods with setLoading(loading: boolean)).
//   [store] Add withLoading() after withEntities. In reload(): setLoading(true) first,
//          setLoading(false) at the end.
//   [html] Replace false with store.loading().
//   Check: Reload shows "Reloading…" for half a second.
//
//  Spec: pnpm nx test ward --include='**/alarm-board.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-alarm-board',
  templateUrl: './alarm-board.html',
  styleUrl: './alarm-board.scss',
})
export default class AlarmBoard {
  protected readonly store = inject(AlarmBoardStore);
}
