import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type RpcResult } from '@core/messaging/contract';

@Component({
  selector: 'app-temperature-form',
  imports: [RouterLink],
  template: `
    <section class="page narrow">
      <a class="back" [routerLink]="['/ward', slug()]">← {{ patient().bed }}</a>
      <!-- blocking resource: the name is there on first paint -->
      <h1>Record temperature</h1>
      <p class="muted">{{ patient().name }} · {{ patient().bed }}</p>

      <form class="card form" (submit)="$event.preventDefault(); save()">
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

  protected readonly value = signal('');
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly slug = computed(() => this.patient().bed.toLowerCase());
  private readonly saved = signal(false);

  /** A typed but unsent value. */
  readonly dirty = computed(() => this.value() !== '' && !this.saved());

  protected text(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected save(): void {
    // Lab task 3: send 'vitals.record' here
  }
}
