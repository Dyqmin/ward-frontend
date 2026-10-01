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
