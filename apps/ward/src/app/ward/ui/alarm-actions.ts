import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Observable, finalize } from 'rxjs';

import { commandRetry } from '@core/messaging/command-retry';
import { AuthStore } from '@core/auth/auth-store';
import {
  MessageBus,
  assertNever,
  type CommandResult,
  type SnoozeMinutes,
  SNOOZE_MINUTES,
} from '@core/messaging/contract';
import { Toasts } from '@core/ui/toasts';
import { isBad } from '@perf/perf-modes';
import { check, trackInstance } from '@perf/perf-stats';
import { AlarmSound } from '../data/alarm-sound';
import type { AlarmView } from '../data/alarms-store';
import { alarmStatus, alarmTitle, clock, isUrgent, who } from './format';

@Component({
  selector: 'app-alarm-actions',
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
  readonly urgent = computed(() => isUrgent(this.alarm()));
  protected readonly canAck = computed(() => isUrgent(this.alarm()));
  protected readonly canSnooze = computed(
    () => this.alarm().event.status !== 'snoozed',
  );
  protected readonly check = check;

  constructor() {
    trackInstance(this, 'AlarmActions');
    const sound = inject(AlarmSound);
    sound.register(this);
    if (isBad('m3')) {
      // ❌ BAD (M3): registered, never unregistered. The root service now holds this row — and
      // through it, its DOM — for as long as the app runs. It also beeps for alarms nobody sees.
    } else {
      // ✅ GOOD (M3): whatever you register, unregister when the component goes away.
      inject(DestroyRef).onDestroy(() => sound.unregister(this));
    }
  }

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
