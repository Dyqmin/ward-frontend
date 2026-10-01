import { Component, computed, inject, input, signal } from '@angular/core';
import { finalize, Observable } from 'rxjs';

import {
  alarmStatus,
  alarmTitle,
  type AlarmView,
  isUrgent,
} from '@wm/monitoring/domain';
import { AuthStore } from '@wm/shared/data-access-auth';
import { commandRetry, MessageBus } from '@wm/shared/data-access-messaging';
import { Toasts } from '@wm/shared/data-access-toasts';
import {
  assertNever,
  type CommandResult,
  SNOOZE_MINUTES,
  type SnoozeMinutes,
  who,
} from '@wm/shared/domain';
import { clock } from '@wm/shared/util-dates';

@Component({
  selector: 'wm-alarm-actions',
  templateUrl: './alarm-actions.html',
  styleUrl: './alarm-actions.scss',
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
  protected readonly canSnooze = computed(
    () => this.alarm().event.status !== 'snoozed',
  );

  ack(): void {
    const { alarmId } = this.alarm().event;
    this.run(this.bus.send('/app/alarms.ack', { alarmId }), () => undefined);
  }

  snooze(minutes: SnoozeMinutes): void {
    const { alarmId } = this.alarm().event;
    this.run(
      this.bus.send('/app/alarms.snooze', { alarmId, minutes }),
      (until) =>
        this.toasts.show(`Snoozed until ${clock(until.until)}`, 'success'),
    );
  }

  /**
   * Command, then event: the reply only tells THIS nurse the outcome. Every screen, including this
   * one, updates from the /topic/alarms.{ward} broadcast.
   */
  private run<T>(
    command$: Observable<CommandResult<T>>,
    onAccepted: (value: T) => void,
  ): void {
    this.pending.set(true);
    command$
      .pipe(
        commandRetry(this.bus),
        finalize(() => this.pending.set(false)),
      )
      .subscribe({
        next: (r) => {
          switch (r.status) {
            case 'accepted':
              return onAccepted(r.value); // the ward topic will broadcast the new state
            case 'conflict':
              return this.toasts.show(
                `Already handled by ${who(r.by)} at ${clock(r.at)}`,
                'warn',
              ); // the room-game moment
            case 'forbidden':
              return this.toasts.show(r.reason, 'error');
            default:
              return assertNever(r);
          }
        },
        error: () =>
          this.toasts.show(
            'Broker unreachable — the alarm was not updated, try again',
            'error',
          ),
      });
  }
}
