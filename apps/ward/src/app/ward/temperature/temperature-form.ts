import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { MessageBus, assertNever, link, toSlug, type RpcResult } from '@core/messaging/contract';
import { Toasts } from '@core/ui/toasts';
import { commandRetry } from '../ui/alarm-actions';
import { clock, who } from '../ui/format';

@Component({
  selector: 'app-temperature-form',
  imports: [RouterLink],
  template: `
    <section class="page narrow">
      <a class="back" [routerLink]="['/ward', slug()]">← {{ patient().bed }}</a>
      <!-- blocking resource: the name is there on first paint -->
      <h1>Record temperature</h1>
      <p class="muted">{{ patient().name }} · {{ patient().bed }}</p>

      <form class="card form" novalidate (submit)="$event.preventDefault(); save()">
        <label>
          Temperature (°C)
          <input
            name="temp"
            type="number"
            inputmode="decimal"
            step="0.1"
            min="30"
            max="43"
            autofocus
            [value]="value()"
            (input)="value.set(text($event))"
          />
        </label>
        @if (error(); as e) {
          <p class="error-text">{{ e }}</p>
        }
        <div class="row">
          @if (pending()) {
            <span class="chip warn">pending sync…</span>
          }
          <span class="spacer"></span>
          <button type="submit" class="primary" [disabled]="pending() || !value()">Save</button>
        </div>
      </form>
    </section>
  `,
  styles: `
    .narrow {
      max-width: 28rem;
    }
    .back {
      text-decoration: none;
    }
    .form {
      display: grid;
      gap: 0.9rem;
    }
    input {
      font-size: 1.6rem;
      width: 9rem;
    }
  `,
})
export default class TemperatureForm {
  /** Blocking `patient` resource from the route: a plain Patient, never undefined. */
  readonly patient = input.required<RpcResult<'patients.get'>>();

  private readonly bus = inject(MessageBus);
  private readonly router = inject(Router);
  private readonly toasts = inject(Toasts);

  protected readonly value = signal('');
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly slug = computed(() => toSlug(this.patient().bed));
  private readonly saved = signal(false);

  /** A typed but unsent value. */
  readonly dirty = computed(() => this.value() !== '' && !this.saved());

  protected text(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected save(): void {
    const value = Number(this.value());
    if (!Number.isFinite(value)) return this.error.set('Enter a number');
    this.pending.set(true);
    this.error.set(null);
    // send() stamps ONE commandId; retry() resends that same command, so an outage never records twice.
    // vital: 'hr' or a missing bed would not compile – ManualVital is 'temp' only.
    this.bus
      .send('/app/vitals.record', { bed: this.patient().bed, vital: 'temp', value })
      .pipe(
        commandRetry(),
        finalize(() => this.pending.set(false)),
      )
      .subscribe({
        next: (r) => {
          switch (r.status) {
            case 'accepted':
              this.saved.set(true); // lets the unsent-value guard pass
              this.toasts.show(`${value.toFixed(1)} °C recorded for ${this.patient().bed}`, 'success');
              void this.router.navigateByUrl('/' + link('ward/:bed', { bed: toSlug(this.patient().bed) }));
              return;
            case 'conflict':
              return this.error.set(`Recorded by ${who(r.by)} at ${clock(r.at)}`);
            case 'forbidden':
              return this.error.set(r.reason); // e.g. "Implausible value"
            default:
              return assertNever(r);
          }
        },
        error: () => this.error.set('Broker unreachable — not saved. Try again.'),
      });
  }
}
