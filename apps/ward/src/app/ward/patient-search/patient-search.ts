import { Component, ElementRef, viewChild } from '@angular/core';

import type { PatientSummary } from '@core/messaging/contract';

// DAY 4 · INSTRUCTOR DEMO — the search button in the header and its dialog. Ready-made, except
// the store: the steps start in patient-search.store.ts.

// STEP 2 · inject the store
// Show: inject it like any service. providedIn: 'root' → one store for the whole app.
// import { inject } from '@angular/core';
// import { PatientSearchStore } from './patient-search.store';

@Component({
  selector: 'app-patient-search',
  templateUrl: './patient-search.html',
  styleUrl: './patient-search.scss',
})
export class PatientSearch {
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  // STEP 2: replace the placeholder with the store
  // protected readonly store = inject(PatientSearchStore);
  protected readonly patients: PatientSummary[] = [];

  protected open(): void {
    this.dialog().nativeElement.showModal();
  }
}
