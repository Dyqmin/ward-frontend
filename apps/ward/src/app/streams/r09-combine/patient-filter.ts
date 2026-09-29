import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, debounceTime, map } from 'rxjs';

import { wardOf, type Patient, type Ward } from '@core/messaging/contract';
import { WARMUP_PATIENTS } from '../../warmup/warmup-patients';

// ============================================================================================
//  DAY 3 · R.9 · COMBINELATEST AND DEBOUNCETIME
// ============================================================================================
//  combineLatest joins several sources: every time ANY of them sends a value, it sends an array
//  with the LATEST value of each. Here: the chosen ward and the search text together give the
//  list of patients to show. It only starts once every source has sent at least one value.
//  [ts] = this file, [html] = patient-filter.html. Operators and subjects come from 'rxjs'.
//
//   [ts]   First add AsyncPipe (from @angular/common) to the component's imports.
//
//  R.9a · the ward
//   [ts]   Create a protected field `ward$`: a new BehaviorSubject of Ward | 'All', starting
//          with 'All'.
//   [html] The ward buttons are ready: on click, push the button's ward into ward$ with next.
//
//  R.9b · the search text
//   [ts]   Create a protected field `search$`: a new BehaviorSubject of string, starting with ''.
//   [html] The search field is ready: on every input event, push the field's current value
//          into search$ with next. (The field has the template reference #search.)
//
//  R.9c · combine them
//   [ts]   Create a protected field `visible$`: combineLatest of an array with two sources:
//            - ward$;
//            - search$ piped through debounceTime(300): it waits until nobody has typed for
//              300 ms, then sends only the last text;
//          then piped through map: from [ward, text] to the patients (the field `patients`)
//          that are in that ward ('All' = every ward; the ward of a patient is wardOf(bed),
//          from @core/messaging/contract) AND whose name contains the text, ignoring upper and
//          lower case.
//
//  R.9d · show the list
//   [html] In the <ul class="patients">: an @if on visible$ with the async pipe, with the
//          alias `list`; inside it an @for over list (track by id), one <li> per patient with
//          the patient's name.
//   Check: at start 10 patients. ICU → 4. Type "d": the list waits a moment, then shows 2.
//   Why BehaviorSubjects: with plain Subjects combineLatest would wait for both to send
//   something first, so the list would stay empty until you clicked a ward AND typed.
//
//  Spec: pnpm nx test ward --include='**/patient-filter.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-patient-filter',
  imports: [AsyncPipe],
  templateUrl: './patient-filter.html',
  styleUrl: './patient-filter.scss',
})
export default class PatientFilter {
  protected readonly patients: readonly Patient[] = WARMUP_PATIENTS;
  protected readonly wards: readonly (Ward | 'All')[] = [
    'All',
    'ICU',
    'ER',
    'CARD',
  ];

  protected readonly ward$ = new BehaviorSubject<Ward | 'All'>('All'); // R.9a
  protected readonly search$ = new BehaviorSubject<string>(''); // R.9b

  // R.9c
  protected readonly visible$ = combineLatest([
    this.ward$,
    this.search$.pipe(debounceTime(300)),
  ]).pipe(
    map(([ward, text]) =>
      this.patients.filter(
        (p) =>
          (ward === 'All' || wardOf(p.bed) === ward) &&
          p.name.toLowerCase().includes(text.toLowerCase()),
      ),
    ),
  );
}
