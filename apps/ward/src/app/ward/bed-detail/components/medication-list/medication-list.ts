import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';

import { AuthStore } from '@core/auth/auth-store';
import {
  MessageBus,
  assertNever,
  type MedOrder,
  type MedOrderId,
} from '@core/messaging/contract';
import { Toasts } from '@core/ui/toasts';
import { commandRetry } from '@core/messaging/command-retry';
import { clock, who } from '../../../ui/format';

@Component({
  selector: 'app-medication-list',
  templateUrl: './medication-list.html',
  styleUrl: './medication-list.scss',
})
export class MedicationList {
  readonly orders = input.required<readonly MedOrder[]>();
  /** Asks the parent to reload the list after a confirmed dose. */
  readonly changed = output<void>();

  private readonly bus = inject(MessageBus);
  private readonly toasts = inject(Toasts);
  private readonly auth = inject(AuthStore);
  protected readonly isNurse = computed(() => this.auth.role() === 'nurse');
  protected readonly pending = signal<ReadonlySet<MedOrderId>>(new Set());
  protected readonly who = who;
  protected readonly clock = clock;

  /** A duplicate send on flaky Wi-Fi must never record a second dose: one commandId, retried as-is. */
  protected give(id: MedOrderId): void {
    this.pending.update((s) => new Set(s).add(id));
    this.bus
      .send('/app/medication.given', { id })
      .pipe(
        commandRetry(this.bus),
        finalize(() =>
          this.pending.update((s) => {
            const next = new Set(s);
            next.delete(id);
            return next;
          }),
        ),
      )
      .subscribe({
        next: (r) => {
          switch (r.status) {
            case 'accepted':
              this.toasts.show('Dose recorded', 'success');
              break;
            case 'conflict':
              this.toasts.show(
                `Already given by ${who(r.by)} at ${clock(r.at)}`,
                'warn',
              );
              break;
            case 'forbidden':
              this.toasts.show(r.reason, 'error');
              break;
            default:
              assertNever(r);
          }
          this.changed.emit();
        },
        error: () =>
          this.toasts.show(
            'Broker unreachable — the dose was NOT recorded, try again',
            'error',
          ),
      });
  }
}
