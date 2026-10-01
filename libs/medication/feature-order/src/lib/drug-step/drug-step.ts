import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { link, MED_ROUTES, type MedOrder } from '@wm/shared/domain';

import { MedOrderDraftStore } from '../med-order-draft-store';

@Component({
  selector: 'wm-drug-step',
  templateUrl: './drug-step.html',
  styleUrl: './drug-step.scss',
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
