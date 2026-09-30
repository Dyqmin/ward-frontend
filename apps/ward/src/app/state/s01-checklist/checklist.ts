import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { ALL_BEDS, WARDS, bedsOf, type BedId } from '@core/messaging/contract';
import { NightRoundActions } from './checklist.actions';
import { checklistFeature } from './checklist.feature';

// ============================================================================================
//  DAY 4 · S.1 · LOOK INSIDE A STORE
// ============================================================================================
//  This tab is ready-made, except one rule you change in S.1c: a checklist for the night round,
//  over every bed of the three wards. You click and you read.
//  The Store holds the state of the whole app in ONE object. Nobody changes that object
//  directly: a component DISPATCHES an action (a plain object that says what happened), and a
//  REDUCER (a pure function) takes the current state and the action and returns the NEXT state.
//  The Store inspector on the right shows both: the last actions, and the state after them.
//  [actions] = checklist.actions.ts, [feature] = checklist.feature.ts, [ts] = this file,
//  [html] = checklist.html.
//
//  S.1a · watch (no code)
//   Click ICU-1, then ER-2, then "Reset round". After every click, read the inspector: which
//   action arrived (its type and the data it carries), and what `checklist` in the state looks
//   like now.
//
//  S.1b · follow one click through the code (no code)
//   Answer in a comment under this block:
//   1. [html] and [ts]: which method runs when you click ICU-1, and what does it hand to the Store?
//   2. [actions]: where does the type "[Night Round] Bed Checked" come from?
//   3. [feature]: which function turned that action into the new state?
//   4. Click ICU-1 twice. What does the state show after the second click, and which line in
//      [feature] decides that?
//
//  S.1c · change a rule: your first Store code
//   [feature] A second click on a checked bed should UNCHECK it. In the handler for Bed Checked,
//          when the bed is already in `checked`, return a new state whose `checked` is the old
//          list without that bed (filter). Keep the other case as it is.
//   Check: click ICU-1 twice. The inspector shows two "Bed Checked" actions, and ICU-1 is no
//   longer in `checked`. You changed only the rule: not the component, not the action.
//
//  The same steps as Markdown, easier to read: checklist.md, next to this file.
//  Spec: pnpm nx test ward --include='**/checklist.spec.ts' --reporters=verbose
// ============================================================================================
// S.1b:
// 1. The (click) of the bed button calls check(bed). It hands the Store an action object:
//    NightRoundActions.bedChecked({ bed }), i.e. { type: '[Night Round] Bed Checked', bed }.
// 2. From createActionGroup: "[" + the source 'Night Round' + "] " + the event 'Bed Checked'.
// 3. The reducer of checklistFeature: the on() handler for NightRoundActions.bedChecked.
// 4. Still one ICU-1: the handler returns the old state unchanged when `checked` already
//    includes the bed (the `? state` case). A second action arrived; the state did not change.

@Component({
  selector: 'app-checklist',
  templateUrl: './checklist.html',
  styleUrl: './checklist.scss',
})
export default class Checklist {
  private readonly store = inject(Store);

  protected readonly wards = WARDS;
  protected readonly bedsOf = bedsOf;
  protected readonly total = ALL_BEDS.length;
  /** A selector turned into a signal: it updates every time the checked list changes. */
  protected readonly checked = this.store.selectSignal(
    checklistFeature.selectChecked,
  );

  protected check(bed: BedId): void {
    this.store.dispatch(NightRoundActions.bedChecked({ bed }));
  }

  protected reset(): void {
    this.store.dispatch(NightRoundActions.roundReset());
  }
}
