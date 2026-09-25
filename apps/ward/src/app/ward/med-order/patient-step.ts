import { Component, computed, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { bedFromSlug, bedsOf, link, wardOf, type Patient } from '@core/messaging/contract';
import { PatientsStore } from '../data/patients-store';
import { MedOrderDraftStore } from './med-order-draft-store';

@Component({
  selector: 'app-patient-step',
  template: `
    <h2>Pick the patient</h2>
    @if (candidates(); as list) {
      <div class="list" role="radiogroup">
        @for (p of list; track p.id) {
          <label class="option" [class.selected]="store.draft().patientId === p.id">
            <input type="radio" name="patient" [checked]="store.draft().patientId === p.id" (change)="store.patch({ patientId: p.id })" />
            <strong>{{ p.bed }}</strong> {{ p.name }}
          </label>
        }
      </div>
    } @else {
      <p class="muted">Loading patients…</p>
    }
    <div class="row nav">
      <span class="spacer"></span>
      <button type="button" class="primary" [disabled]="!store.isDone('patient')" (click)="next()">Next</button>
    </div>
  `,
  styles: `
    .list {
      display: grid;
      gap: 0.4rem;
    }
    .option {
      display: flex;
      gap: 0.6rem;
      align-items: center;
      color: var(--text);
      padding: 0.5rem 0.7rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
    }
    .option.selected {
      border-color: var(--accent);
    }
    .nav {
      margin-top: 1rem;
    }
  `,
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
      const own = this.candidates()?.find((p) => p.bed === bedFromSlug(this.bed()));
      if (own && !this.store.draft().patientId) this.store.patch({ patientId: own.id });
    });
  }

  protected next(): void {
    void this.router.navigateByUrl('/' + link('ward/:bed/meds/new/:step', { bed: this.bed(), step: 'drug' }));
  }
}
