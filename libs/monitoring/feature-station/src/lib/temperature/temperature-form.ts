import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { commandRetry, MessageBus } from '@wm/shared/data-access-messaging';
import { Toasts } from '@wm/shared/data-access-toasts';
import {
  assertNever,
  link,
  type RpcResult,
  toSlug,
  who,
} from '@wm/shared/domain';
import { clock } from '@wm/shared/util-dates';

@Component({
  selector: 'wm-temperature-form',
  imports: [RouterLink],
  templateUrl: './temperature-form.html',
  styleUrl: './temperature-form.scss',
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
      .send('/app/vitals.record', {
        bed: this.patient().bed,
        vital: 'temp',
        value,
      })
      .pipe(
        commandRetry(this.bus),
        finalize(() => this.pending.set(false)),
      )
      .subscribe({
        next: (r) => {
          switch (r.status) {
            case 'accepted':
              this.saved.set(true); // lets the unsent-value guard pass
              this.toasts.show(
                `${value.toFixed(1)} °C recorded for ${this.patient().bed}`,
                'success',
              );
              void this.router.navigateByUrl(
                '/' + link('ward/:bed', { bed: toSlug(this.patient().bed) }),
              );
              return;
            case 'conflict':
              return this.error.set(
                `Recorded by ${who(r.by)} at ${clock(r.at)}`,
              );
            case 'forbidden':
              return this.error.set(r.reason); // e.g. "Implausible value"
            default:
              return assertNever(r);
          }
        },
        error: () =>
          this.error.set('Broker unreachable — not saved. Try again.'),
      });
  }
}
