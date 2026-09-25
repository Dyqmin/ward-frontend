import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MedOrderDraftStore, type WizardStep } from './med-order-draft-store';

/** Header + stepper + <router-outlet>; the steps are child routes. */
@Component({
  selector: 'app-med-order-wizard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section class="page wizard">
      <a class="back" [routerLink]="['/ward', bed()]"
        >← {{ bed().toUpperCase() }}</a
      >
      <h1>New medication order</h1>
      <ol class="steps">
        @for (s of steps; track s.path; let i = $index) {
          <li>
            <a
              [routerLink]="s.path"
              routerLinkActive="active"
              [class.done]="done(s.path)"
              >{{ i + 1 }}. {{ s.label }}</a
            >
          </li>
        }
      </ol>
      @if (store.dirty()) {
        <p class="chip warn">Unsaved draft</p>
      }
      <div class="card">
        <router-outlet />
      </div>
    </section>
  `,
  styles: `
    .wizard {
      max-width: 44rem;
    }
    .back {
      text-decoration: none;
    }
    .steps {
      display: flex;
      gap: 0.5rem;
      list-style: none;
      padding: 0;
      flex-wrap: wrap;
    }
    .steps a {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--muted);
      text-decoration: none;
    }
    .steps a.done {
      border-color: var(--ok);
      color: var(--text);
    }
    .steps a.active {
      border-color: var(--accent);
      color: var(--text);
      background: var(--card-2);
    }
  `,
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
