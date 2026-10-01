import { Component, inject } from '@angular/core';

import type { Patient } from '@core/messaging/contract';
import { PatientDirectory } from '../signal-store-data';

// ============================================================================================
//  DAY 4 · SS.4–6 · LAB 2: A STORE THAT LOADS ITS OWN DATA
// ============================================================================================
//  Search patients by name. PatientDirectory (ready-made) answers after 500 ms; the chip
//  "Requests sent" counts every request it gets.
//  [store] = patient-search.store.ts, [ts] = this file, [html] = patient-search.html
//  All imports you need today are ready in [store].
//
//  SS.4a · the state
//   [store] A type `SearchState`: term (string), patients (Patient[]), loading (boolean), and an
//          `initialState`. Export `PatientSearchStore`: signalStore, { providedIn: 'root' },
//          withState(initialState).
//
//  SS.4b · a service inside the store
//   [store] withProps(() => ({ _directory: inject(PatientDirectory) })) after withState.
//   Tip: _ in front = private: the store's blocks see it, components don't.
//
//  SS.4c · an async method
//   [store] withMethods with async load(term: string): patch term and loading: true, then
//          `await store._directory.search(term)`, then patch patients and loading: false.
//
//  SS.4d · load on start
//   [store] withHooks, last block: onInit(store) calls store.load('').
//
//  SS.4e · connect the page
//   [ts]   Inject PatientSearchStore into `store`. Delete `noPatients`.
//   [html] The three SS.4e comments: loading, input, list.
//   Check: "Loading…", then 10 patients. Type "an": the list filters, one request per key.
//
//  SS.5 · the store follows the term by itself (signalMethod)
//   SS.5a [store] A method setTerm(term: string) that only patches term.
//   SS.5b [store] A SECOND withMethods under the first one:
//          followTerm: signalMethod<string>((term) => { void store.load(term); })
//   Tip: a block only sees the blocks above it. That's why load() needs its own block first.
//   SS.5c [store] In onInit: store.followTerm(store.term) instead of store.load('').
//   Tip: store.term WITHOUT () passes the signal, so followTerm runs on every change.
//   SS.5d [html] On input, call store.setTerm(input.value) instead of store.load(…).
//   Check: the same as SS.4, but the component only sets the term.
//
//  SS.6 · extra: wait for the typing to stop (rxMethod)
//   [store] Replace signalMethod with rxMethod<string>(pipe(…)):
//          debounceTime(300) → tap: loading true → switchMap to store._directory.search$(term),
//          and inside that, tapResponse({ next: patch patients + loading false,
//          error: patch loading false }).
//   Check: type "ann" fast. "Requests sent" goes up by 1, not 3.
//
//  Spec: pnpm nx test ward --include='**/patient-search.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-patient-search',
  templateUrl: './patient-search.html',
  styleUrl: './patient-search.scss',
})
export default class PatientSearch {
  protected readonly directory = inject(PatientDirectory);

  /** SS.4e · delete me, loop over the store's patients instead. */
  protected readonly noPatients: Patient[] = [];
}
