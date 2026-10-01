import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MedOrderDraftStore, type WizardStep } from '../med-order-draft-store';

/** Header + stepper + <router-outlet>; the steps are child routes. */
@Component({
  selector: 'app-med-order-wizard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './med-order-wizard.html',
  styleUrl: './med-order-wizard.scss',
})
export default class MedOrderWizard {
  /** :bed slug, bound by withComponentInputBinding(). */
  readonly bed = input.required<string>();
  /** Public: unsavedDraftGuard reads it. From the route injector, not root. */
  readonly store = inject(MedOrderDraftStore);

  protected readonly steps: readonly { path: WizardStep; label: string }[] = [
    { path: 'patient', label: 'Patient' },
    { path: 'drug', label: 'Drug and dose' },
    { path: 'review', label: 'Review' },
  ];

  protected done(step: WizardStep): boolean {
    return step !== 'review' && this.store.isDone(step);
  }
}
