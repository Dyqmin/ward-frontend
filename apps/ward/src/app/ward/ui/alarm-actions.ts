import { Component, computed, inject, input, signal } from '@angular/core';
import { Observable, finalize, retry, timer } from 'rxjs';

import { AuthStore } from '@core/auth/auth-store';
import { MessageBus, assertNever, type CommandResult, type SnoozeMinutes, SNOOZE_MINUTES } from '@core/messaging/contract';
import { Toasts } from '@core/ui/toasts';
import type { AlarmView } from '../data/alarms-store';
import { alarmStatus, alarmTitle, clock, isUrgent, who } from './format';

/** Up to 5 retries, 500 ms → 8 s. Safe only because every retry carries the same commandId. */
export const commandRetry = <T>() =>
  retry<T>({ count: 5, delay: (_, n) => timer(Math.min(500 * 2 ** (n - 1), 8_000)) });

@Component({
  selector: 'app-alarm-actions',
  template: `
    <div class="alarm" [class.urgent]="urgent()">
      <div>
        <strong>{{ alarm().event.bed }} · {{ title() }}</strong>
        <div class="muted">{{ status() }}</div>
      </div>
      <div class="row actions">
        @if (pending()) {
          <span class="chip warn">pending sync…</span>
        }
        @if (isNurse()) {
          @if (canAck()) {
            <button type="button" class="primary small" [disabled]="pending()" (click)="ack()">Acknowledge</button>
          }
          @if (canSnooze()) {
            @for (m of snoozeOptions; track m) {
              <button type="button" class="small" [disabled]="pending()" (click)="snooze(m)">Snooze {{ m }}′</button>
            }
          }
        }
      </div>
    </div>
  `,
  styles: `
    .alarm {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border);
      border-left: 4px solid var(--warn);
      border-radius: 8px;
      background: var(--card-2);
    }
    .alarm.urgent {
      border-left-color: var(--bad);
    }
  `,
})
export class AlarmActions {
  readonly alarm = input.required<AlarmView>();

  private readonly bus = inject(MessageBus);
  private readonly toasts = inject(Toasts);
  private readonly auth = inject(AuthStore);
  protected readonly isNurse = computed(() => this.auth.role() === 'nurse');
  protected readonly snoozeOptions = SNOOZE_MINUTES;

  /** "pending sync" chip, visible until the server confirms. */
  protected readonly pending = signal(false);
  protected readonly title = computed(() => alarmTitle(this.alarm()));
  protected readonly status = computed(() => alarmStatus(this.alarm()));
  protected readonly urgent = computed(() => isUrgent(this.alarm()));
  protected readonly canAck = computed(() => isUrgent(this.alarm()));
  protected readonly canSnooze = computed(() => this.alarm().event.status !== 'snoozed');

  ack(): void {
    const { alarmId } = this.alarm().event;
    this.run(this.bus.send('/app/alarms.ack', { alarmId }), () => undefined);
  }

  snooze(minutes: SnoozeMinutes): void {
    const { alarmId } = this.alarm().event;
    this.run(this.bus.send('/app/alarms.snooze', { alarmId, minutes }), (until) =>
      this.toasts.show(`Snoozed until ${clock(until.until)}`, 'success'),
    );
  }

  /**
   * Command, then event: the reply only tells THIS nurse the outcome. Every screen, including this
   * one, updates from the /topic/alarms.{ward} broadcast.
   */
  private run<T>(command$: Observable<CommandResult<T>>, onAccepted: (value: T) => void): void {
    this.pending.set(true);
    command$
      .pipe(
        commandRetry(),
        finalize(() => this.pending.set(false)),
      )
      .subscribe({
        next: (r) => {
          switch (r.status) {
            case 'accepted':
              return onAccepted(r.value); // the ward topic will broadcast the new state
            case 'conflict':
              return this.toasts.show(`Already handled by ${who(r.by)} at ${clock(r.at)}`, 'warn'); // the room-game moment
            case 'forbidden':
              return this.toasts.show(r.reason, 'error');
            default:
              return assertNever(r);
          }
        },
        error: () => this.toasts.show('Broker unreachable — the alarm was not updated, try again', 'error'),
      });
  }
}
