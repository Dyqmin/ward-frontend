import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { MED_ROUTES, link, type MedOrder } from '@core/messaging/contract';
import { MedOrderDraftStore } from './med-order-draft-store';

@Component({
  selector: 'app-drug-step',
  template: `
    <h2>Drug and dose</h2>
    <div class="form">
      <label>
        Drug
        <input
          name="drug"
          list="drugs"
          [value]="store.draft().drug ?? ''"
          (input)="store.patch({ drug: text($event) })"
        />
        <datalist id="drugs">
          @for (d of commonDrugs; track d) {
            <option [value]="d"></option>
          }
        </datalist>
      </label>
      <label>
        Dose (mg)
        <input
          name="dose"
          type="number"
          min="0"
          step="any"
          [value]="store.draft().doseMg ?? ''"
          (input)="store.patch({ doseMg: dose($event) })"
        />
      </label>
      <label>
        Route
        <select
          name="route"
          [value]="store.draft().route ?? ''"
          (change)="store.patch({ route: route($event) })"
        >
          <option value="" disabled>Choose…</option>
          @for (r of routes; track r) {
            <option [value]="r">
              {{ r === 'iv' ? 'Intravenous (iv)' : 'Oral' }}
            </option>
          }
        </select>
      </label>
    </div>
    <div class="row nav">
      <button type="button" (click)="go('patient')">Back</button>
      <span class="spacer"></span>
      <button
        type="button"
        class="primary"
        [disabled]="!store.isDone('drug')"
        (click)="go('review')"
      >
        Next
      </button>
    </div>
  `,
  styles: `
    .form {
      display: grid;
      gap: 0.8rem;
      max-width: 22rem;
    }
    .nav {
      margin-top: 1rem;
    }
  `,
})
export default class DrugStep {
  readonly bed = input.required<string>();
  protected readonly store = inject(MedOrderDraftStore);
  private readonly router = inject(Router);
  protected readonly routes = MED_ROUTES;
  protected readonly commonDrugs = [
    'Paracetamol',
    'Ondansetron',
    'Amoxicillin',
    'Metoprolol',
    'Furosemide',
  ];

  protected text(e: Event): string {
    return (e.target as HTMLInputElement).value.trim();
  }
  /** Empty or non-positive → undefined, so the step is not "done". The server checks doseMg > 0 too. */
  protected dose(e: Event): number | undefined {
    const n = (e.target as HTMLInputElement).valueAsNumber;
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  protected route(e: Event): MedOrder['route'] | undefined {
    const v = (e.target as HTMLSelectElement).value;
    return MED_ROUTES.find((r) => r === v);
  }

  protected go(step: 'patient' | 'review'): void {
    void this.router.navigateByUrl(
      '/' + link('ward/:bed/meds/new/:step', { bed: this.bed(), step }),
    );
  }
}
