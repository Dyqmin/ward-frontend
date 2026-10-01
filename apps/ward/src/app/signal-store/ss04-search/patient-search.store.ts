import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalMethod,
  signalStore,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { debounceTime, pipe, switchMap, tap } from 'rxjs';

import type { Patient } from '@core/messaging/contract';
import { PatientDirectory } from '../signal-store-data';

// SS.4–6 · PatientSearchStore. The steps are in patient-search.ts.

// SS.4a
type SearchState = {
  term: string;
  patients: Patient[];
  loading: boolean;
};

const initialState: SearchState = {
  term: '',
  patients: [],
  loading: false,
};

export const PatientSearchStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withProps(() => ({
    _directory: inject(PatientDirectory), // SS.4b
  })),
  withMethods((store) => ({
    // SS.4c
    async load(term: string): Promise<void> {
      patchState(store, { term, loading: true });
      const patients = await store._directory.search(term);
      patchState(store, { patients, loading: false });
    },
    // SS.5a
    setTerm(term: string): void {
      patchState(store, { term });
    },
  })),
  // SS.5b · a second withMethods: it sees load() from the block above
  withMethods((store) => ({
    followTerm: signalMethod<string>((term) => {
      void store.load(term);
    }),
  })),
  withHooks({
    onInit(store) {
      store.followTerm(store.term); // SS.5c · the signal, no ()
    },
  }),
);
