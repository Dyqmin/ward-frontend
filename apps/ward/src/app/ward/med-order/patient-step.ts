import { Component, computed, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import {
  bedFromSlug,
  bedsOf,
  link,
  wardOf,
  type Patient,
} from '@core/messaging/contract';
import { PatientsStore } from '../data/patients-store';
import { MedOrderDraftStore } from './med-order-draft-store';

@Component({
  selector: 'app-patient-step',
  templateUrl: './patient-step.html',
  styleUrl: './patient-step.scss',
})
export default class PatientStep {
  /** The parent's :bed, visible here because params are inherited (v22 default 'always'). */
  readonly bed = input.required<string>();
  protected readonly store = inject(MedOrderDraftStore);
  private readonly patients = inject(PatientsStore);
  private readonly router = inject(Router);

  /** Patients on the same ward as the bed the wizard was opened from. */
  protected readonly candidates = computed(() => {
    const bed = bedFromSlug(this.bed());
    if (!bed || !this.patients.loaded()) return null;
    return bedsOf(wardOf(bed))
      .map((b) => this.patients.patient(b))
      .filter((p): p is Patient => !!p);
  });

  constructor() {
    // preselect the patient in the bed the doctor came from
    effect(() => {
      const own = this.candidates()?.find(
        (p) => p.bed === bedFromSlug(this.bed()),
      );
      if (own && !this.store.draft().patientId)
        this.store.patch({ patientId: own.id });
    });
  }

  protected next(): void {
    void this.router.navigateByUrl(
      '/' + link('ward/:bed/meds/new/:step', { bed: this.bed(), step: 'drug' }),
    );
  }
}
