import { Component } from '@angular/core';

// ============================================================================================
//  DAY 2 · EXERCISE 0 · SIGNALS WARM-UP
// ============================================================================================
//  Before the live data: the four signal primitives on a fixed list of patients, one at a time.
//  Open /warmup (link "Warm-up" in the header). No bus, no backend: the patients are a plain
//  array in warmup-patients.ts (ready-made, don't change it).
//
//  Do the steps in order. [ts] = this file, [html] = warmup.html (the template steps are
//  repeated there). Styles are ready in warmup.scss.
//
//  Check with the spec after every step (it runs once; run it again after each change):
//    pnpm nx test ward --include='**/warmup.spec.ts' --reporters=verbose
//  Every test is named after its step; ✓ = passing, × = failing.
// ============================================================================================
//
//  STEP 0.1 · signal: the list
//   Goal: the page lists all patients.
//   [ts]   Create a protected signal `patients` (type readonly Patient[], Patient from
//          @core/messaging/contract) whose initial value is WARMUP_PATIENTS (from
//          ./warmup-patients).
//   [html] In the <ul class="patients">, loop with @for over patients() (track by the patient's
//          id). For each patient, an <li> holding:
//            - a button with class "name" and type "button", with the patient's name as text;
//            - a span with class "bed" with the patient's bed;
//            - a button with class "discharge" and type "button", with the text "Discharge"
//              (it does nothing yet).
//   Check: the page shows 10 patients.
//
//  STEP 0.2 · computed: one ward
//   Goal: filter the list by ward, and count what is shown.
//   [ts]   Create a protected signal `ward` (type Ward | 'All', Ward from
//          @core/messaging/contract), initial value 'All'.
//   [ts]   Create a protected field `wards` with the four choices, in this order:
//          'All', 'ICU', 'ER', 'CARD'.
//   [ts]   Create a protected computed `visible` (type readonly Patient[]): all patients when
//          ward is 'All', otherwise only the patients whose ward is that ward. The ward of a
//          patient comes from its bed: wardOf(bed) (from @core/messaging/contract) gives e.g.
//          'ICU' for 'ICU-3'.
//   [ts]   Create a protected computed `count` (type number): how many patients visible holds.
//   [html] In the <nav class="wards">, loop over wards: one button with type "button" per
//          choice, with the choice as text. A click sets ward to that choice. The button of the
//          current ward has the class "active".
//   [html] The <ul class="patients"> now loops over visible() instead of patients().
//   [html] In the <p class="count">, show "<count> patients", e.g. "4 patients".
//   Check: ICU shows 4 patients, ER 3, CARD 3, All 10, and the count follows.
//
//  STEP 0.3 · update: discharge a patient
//   Goal: change the source, and see every derived value follow by itself.
//   [ts]   Create a protected method `discharge` with one parameter, the patient's id (type
//          PatientId from @core/messaging/contract). It changes patients with the signal's
//          update method: the new value is a NEW array without that patient (don't change the
//          old array in place: a signal only notices a new value).
//   [html] The "Discharge" button calls discharge with its patient's id.
//   Check: Discharge removes the patient; visible and count update without any extra code.
//
//  STEP 0.4 · effect: log what is shown
//   Goal: a side effect that runs whenever the signals it reads change.
//   [ts]   Add a constructor and create an effect in it (effect is in @angular/core). It reads
//          ward and count and writes one line with console.log: "<ward>: <count> patients",
//          e.g. "ICU: 4 patients" or "All: 10 patients".
//   Check: open the browser console: one line when the page opens, and one more every time
//   the ward or the count changes. The effect never says when to run: it runs because of
//   what it reads.
//
//  STEP 0.5 · linkedSignal: the selected patient
//   Goal: a value the user can set, that also resets itself when its source changes.
//   [ts]   Create a protected linkedSignal `selected` (type Patient | undefined): the patient
//          shown in the details panel. linkedSignal takes an options object with two functions:
//            - source: a function that returns visible();
//            - computation: a function with two arguments. The first is the new visible list.
//              The second, `previous`, is undefined on the first run; after that it is an object
//              whose `value` field is the patient that was selected before.
//              Rule: if previous?.value is defined AND a patient with the same id is in the new
//              list, return that patient (keep the selection). Otherwise return the first
//              patient of the new list (undefined if the list is empty).
//          Types: give linkedSignal both type arguments: readonly Patient[], then
//          Patient | undefined.
//   [html] A click on a patient's "name" button sets selected to that patient (a linkedSignal
//          can be set like a signal).
//   [html] The <li> of the selected patient has the class "selected" (compare ids).
//   [html] In the <section class="details">: if there is a selected patient, an <h2> with its
//          name and a <p> with its bed; otherwise a <p> with the text "No patient selected".
//   Check: the first patient is selected at the start. Select another one, switch to its ward:
//   it stays selected. Switch to another ward: the first patient there is selected. Discharge
//   the selected patient: the first one left is selected.
//   Why not a computed: a computed can't be set by a click. Why not a plain signal: it would
//   not reset when the ward changes.
// ============================================================================================

@Component({
  selector: 'app-warmup',
  templateUrl: './warmup.html',
  styleUrl: './warmup.scss',
})
export default class Warmup {}
