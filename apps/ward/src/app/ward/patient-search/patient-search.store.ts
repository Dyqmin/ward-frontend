// ============================================================================================
//  DAY 4 · INSTRUCTOR DEMO — the patient search in the header (not a lab, not on day-4-signals)
// ============================================================================================
//  The dialog is ready: patient-search.ts / .html. Uncomment the steps in order.
//  Data: patients.search over the MessageBus. Works with ?mock, and with ward-worker 158cf92+.
//  The rule to repeat: a keystroke is an EVENT → the template calls a store method. No effect().
// ============================================================================================

// STEP 1 · the state
// Show: signalStore is ONE function call with a list of blocks. withState → every field becomes
// a signal (store.term(), store.patients()). `[] as PatientSummary[]` = an empty list of that type.
//
// import { inject } from '@angular/core';
// import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
// import { firstValueFrom } from 'rxjs';
// import { MessageBus, type PatientSummary } from '@core/messaging/contract';
//
// export const PatientSearchStore = signalStore(
//   { providedIn: 'root' },
//   withState({ term: '', patients: [] as PatientSummary[] }),
// );
//
// Then patient-search.ts and .html: STEP 2.

// STEP 3 · the method — add this block after withState(…), inside signalStore( … )
// Show: `bus = inject(MessageBus)` is a parameter with a default value = constructor injection.
// `=> ({` returns an object of methods. patchState is the ONLY way to change state (try it in a
// component: compile error). firstValueFrom turns the request into a Promise we can await.
//
//   withMethods((store, bus = inject(MessageBus)) => ({
//     async search(term: string): Promise<void> {
//       patchState(store, { term });
//       const patients = await firstValueFrom(
//         bus.request('/app/patients.search', { term, sort: 'name' }),
//       );
//       patchState(store, { patients });
//     },
//   })),
//
// Then patient-search.html: STEP 3. Demo: open the dialog, type "ea" (?mock: Bea Placebo,
// Earl E. Bird). The Dev toolbar (?mock) shows one patients.search per keystroke.

// STEP 4 · only if asked: one request per keystroke, and a slow "an" can overwrite "ann".
// That is what rxMethod is for (SS.6 in the afternoon labs). Replace search with:
//
//   search: rxMethod<string>(
//     pipe(
//       tap((term) => patchState(store, { term })),
//       debounceTime(300),
//       switchMap((term) =>
//         bus.request('/app/patients.search', { term, sort: 'name' }).pipe(
//           tapResponse({
//             next: (patients) => patchState(store, { patients }),
//             error: () => patchState(store, { patients: [] }),
//           }),
//         ),
//       ),
//     ),
//   ),
//
// Imports: rxMethod from '@ngrx/signals/rxjs-interop', tapResponse from '@ngrx/operators',
// pipe, tap, debounceTime, switchMap from 'rxjs'. The template stays the same.

export {};
