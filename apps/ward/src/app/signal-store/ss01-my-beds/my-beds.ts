import { Component } from '@angular/core';

import { WARDS, bedsOf } from '@core/messaging/contract';
import MyBedsCount from './my-beds-count';

// ============================================================================================
//  DAY 4 · SS.1 · YOUR FIRST STORE: MY BEDS
// ============================================================================================
//  A nurse marks the beds they look after this shift. No server: the beds live in a store.
//  [store] = my-beds.store.ts, [ts] = this file, [html] = my-beds.html, [count] = my-beds-count.ts
//  Imports from '@ngrx/signals' are ready in [store]. Add the others with the editor's quick fix.
//
//  SS.1a · the state
//   [store] Export a const `MyBedsStore`: signalStore with { providedIn: 'root' } and withState
//          with one field, `beds`: an empty list of BedId.
//   Tip: [] as BedId[] — an empty list that TypeScript treats as BedId[].
//
//  SS.1b · read it
//   [ts]   Inject MyBedsStore into a protected readonly field `store`.
//   [html] In <p class="mine">, show store.beds() joined with ', '.
//   Check: the page shows "Mine:" and nothing yet. No errors.
//
//  SS.1c · change it
//   [store] Add withMethods with a method toggle(bed: BedId): if the bed is in beds, remove it;
//          otherwise add it. Change the state with patchState.
//   [html] On click of a bed button, call store.toggle(bed).
//   Tip: start with the empty shape withMethods((store) => ({ })), check it compiles, then fill it.
//   Tip: [...beds, bed] adds · beds.filter((b) => b !== bed) removes · beds.includes(bed) asks.
//   Check: click ICU-1 and ER-2 → "Mine: ICU-1, ER-2". Click ICU-1 again → only ER-2 left.
//
//  SS.1d · calculate, don't store
//   [store] Add withComputed with `count`: computed(() => …) of the number of beds. It goes
//          between withState and withMethods.
//   [count] Inject the store and show store.count() in the <strong>.
//   Check: the counter follows your clicks. Two components, one store.
//
//  SS.1e · extra
//   [html] Give a bed button the class primary when it is in store.beds().
//
//  Spec: pnpm nx test ward --include='**/my-beds.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-my-beds',
  imports: [MyBedsCount],
  templateUrl: './my-beds.html',
  styleUrl: './my-beds.scss',
})
export default class MyBeds {
  protected readonly wards = WARDS;
  protected readonly bedsOf = bedsOf;
}
