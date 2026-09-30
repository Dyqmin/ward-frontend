import { Component, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';

import WardPicker from '../s02-ward/ward-picker';
import { selectCheckedInSelectedWard } from './ward.selectors';

// ============================================================================================
//  DAY 4 · S.3 · SELECTORS
// ============================================================================================
//  A selector reads one piece of the state. createFeature already made one for every field of
//  your feature: wardFeature.selectSelected. The store's selectSignal turns a selector into a
//  signal, so a template updates by itself.
//  createSelector builds a NEW selector from other selectors: it takes their results and hands
//  them to its last argument, the projector (a plain function that computes the result). It
//  runs the projector again only when one of those results changes; otherwise it returns the
//  value it remembered. That is how two features are combined without any code in components.
//  [picker] = ../s02-ward/ward-picker.ts, [picker html] = ../s02-ward/ward-picker.html,
//  [selectors] = ward.selectors.ts, [ts] = this file, [html] = ward-overview.html.
//  Add an import whenever you use something from another file (the editor's quick fix does it).
//
//  S.3a · the picker shows the selected ward
//   [picker] Import wardFeature from ./ward.feature. Create a protected field `selected`: the
//          store's selectSignal of wardFeature.selectSelected.
//   [picker html] Give each ward button the class `primary` when its ward is the selected()
//          one (a [class.primary] binding).
//   Check: the button of the selected ward is highlighted, here and on tab S.2.
//
//  S.3b · a selector that combines two features
//   Two pieces of state live in different features: the selected ward (yours, S.2) and the
//   beds checked on the night round (the S.1 checklist). The nurse wants: which beds of THIS
//   ward are already checked?
//   [selectors] Create and export a const `selectCheckedInSelectedWard`: createSelector with two
//          input selectors, wardFeature.selectSelected (import it from ../s02-ward/ward.feature)
//          and checklistFeature.selectChecked, and a projector that receives the ward and the
//          checked beds and returns only the checked beds whose ward is that ward (filter;
//          wardOf(bed) gives the ward of a bed).
//
//  S.3c · read it here
//   [ts]   Inject the Store into a private readonly field `store`.
//   [ts]   Create a protected field `checked`: the store's selectSignal of
//          selectCheckedInSelectedWard.
//   [html] Inside the <ul class="checked-beds">: an @for over checked() (track the bed itself),
//          one <li> per bed with its name; @empty: <li class="muted">none yet</li>.
//   Check: on tab S.1, check ICU-1, ER-2 and ICU-3. Back here with ICU selected: ICU-1 and
//   ICU-3. Click ER: ER-2. Check one more ER bed on S.1 and come back: it is in the list.
//   The component has no filtering code at all: the selector did it.
//
//  S.3d · state that outlives the component (no code)
//   The button "Clicks on this tab" is ready: it counts in a plain signal of THIS component.
//   Click it a few times and pick CARD. Go to tab S.2 and come back: the counter is 0 again
//   (a new component, a new signal), but CARD is still selected: the Store lives outside the
//   components, as long as the app runs. Now reload the page (F5): the Store starts again from
//   its initial state, ICU.
//   Answer in a comment under this block: where would you keep "which ward the nurse is
//   looking at", and where "is this dropdown open"? Why?
//
//  The same steps as Markdown, easier to read: ward-overview.md, next to this file.
//  Spec: pnpm nx test ward --include='**/ward-overview.spec.ts' --reporters=verbose
// ============================================================================================
// S.3d: the ward the nurse is looking at belongs in the Store: several screens read it, and it
// must survive switching tabs. "Is this dropdown open" belongs to one component only and may
// reset with it, so a plain signal in that component is enough.

@Component({
  selector: 'app-ward-overview',
  imports: [WardPicker],
  templateUrl: './ward-overview.html',
  styleUrl: './ward-overview.scss',
})
export default class WardOverview {
  private readonly store = inject(Store);

  protected readonly checked = this.store.selectSignal(
    selectCheckedInSelectedWard,
  ); // S.3c

  /** Ready-made for S.3d: a counter in a plain signal of this component, not in the Store. */
  protected readonly clicks = signal(0);

  protected countClick(): void {
    this.clicks.update((n) => n + 1);
  }
}
