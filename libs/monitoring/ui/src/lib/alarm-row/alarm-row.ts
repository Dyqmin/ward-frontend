import { Component, computed, input, output } from '@angular/core';

import {
  alarmStatus,
  alarmTitle,
  type AlarmView,
  isUrgent,
} from '@wm/monitoring/domain';
import { SNOOZE_MINUTES, type SnoozeMinutes } from '@wm/shared/domain';

/** One alarm with its buttons. Shows what it is given and reports clicks; it injects nothing. */
@Component({
  selector: 'wm-alarm-row',
  templateUrl: './alarm-row.html',
  styleUrl: './alarm-row.scss',
})
export class AlarmRow {
  readonly alarm = input.required<AlarmView>();
  /** Show the buttons (only nurses acknowledge and snooze). */
  readonly canAct = input(false);
  /** A command was sent and the server has not confirmed it yet. */
  readonly pending = input(false);
  readonly acknowledge = output();
  readonly snooze = output<SnoozeMinutes>();

  protected readonly snoozeOptions = SNOOZE_MINUTES;
  protected readonly title = computed(() => alarmTitle(this.alarm()));
  protected readonly status = computed(() => alarmStatus(this.alarm()));
  protected readonly urgent = computed(() => isUrgent(this.alarm()));
  protected readonly canSnooze = computed(
    () => this.alarm().event.status !== 'snoozed',
  );
}
