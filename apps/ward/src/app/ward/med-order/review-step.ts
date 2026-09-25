import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { MessageBus, assertNever, link } from '@core/messaging/contract';
import { Toasts } from '@core/ui/toasts';
import { PatientsStore } from '../data/patients-store';
import { commandRetry } from '@core/messaging/command-retry';
import { who } from '../ui/format';
import { MedOrderDraftStore } from './med-order-draft-store';

@Component({
  selector: 'app-review-step',
  template: `
    <h2>Review</h2>
    @if (store.complete(); as d) {
      <dl>
        <dt>Patient</dt>
        <dd>{{ patientName() }} ({{ d.patientId }})</dd>
        <dt>Drug</dt>
        <dd>{{ d.drug }}</dd>
        <dt>Dose</dt>
        <dd>{{ d.doseMg }} mg</dd>
        <dt>Route</dt>
        <dd>{{ d.route }}</dd>
      </dl>
    }
    @if (error(); as e) {
      <p class="error-text">{{ e }}</p>
    }
    <div class="row nav">
      <button type="button" [disabled]="pending()" (click)="back()">Back</button>
      <span class="spacer"></span>
      @if (pending()) {
        <span class="chip warn">pending sync…</span>
      }
      <button type="button" class="primary" [disabled]="pending() || !store.complete()" (click)="submit()">Order medication</button>
    </div>
  `,
  styles: `
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 0.4rem 1rem;
    }
    dt {
      color: var(--muted);
    }
    dd {
      margin: 0;
    }
    .nav {
      margin-top: 1rem;
    }
  `,
})
export default class ReviewStep {
  readonly bed = input.required<string>();
  protected readonly store = inject(MedOrderDraftStore);
  private readonly bus = inject(MessageBus);
  private readonly router = inject(Router);
  private readonly toasts = inject(Toasts);
  private readonly patients = inject(PatientsStore);

  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly patientName = computed(() => {
    const id = this.store.draft().patientId;
    return [...(this.patients.byBed()?.values() ?? [])].find((p) => p?.id === id)?.name ?? '';
  });

  protected back(): void {
    void this.router.navigateByUrl('/' + link('ward/:bed/meds/new/:step', { bed: this.bed(), step: 'drug' }));
  }

  protected submit(): void {
    const draft = this.store.complete();
    if (!draft) return;
    this.pending.set(true);
    this.error.set(null);
    this.bus
      .send('/app/medication.order', draft) // doctors only — the server rejects it for anyone else
      .pipe(
        commandRetry(this.bus),
        finalize(() => this.pending.set(false)),
      )
      .subscribe({
        next: (r) => {
          switch (r.status) {
            case 'accepted':
              this.store.markSaved(); // lets unsavedDraftGuard pass
              this.toasts.show(`Order ${r.value.id} placed`, 'success');
              void this.router.navigateByUrl('/' + link('ward/:bed', { bed: this.bed() }));
              return;
            case 'conflict':
              return this.error.set(`Conflicts with ${who(r.by)}`);
            case 'forbidden':
              return this.error.set(r.reason);
            default:
              return assertNever(r);
          }
        },
        error: () => this.error.set('Broker unreachable — the order was not placed. Try again.'),
      });
  }
}
