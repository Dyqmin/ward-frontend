import { Component, computed, input, output } from '@angular/core';

import type { AlarmEvent } from '@core/messaging/contract';
import { alarmStatus, alarmTitle, canAcknowledge } from './alarm-helpers';

/**
 * Ready-made: one alarm of the board. It only shows what it gets and reports the click:
 * it knows nothing about the Store or the broker.
 */
@Component({
  selector: 'app-alarm-row',
  templateUrl: './alarm-row.html',
  styleUrl: './alarm-row.scss',
})
export class AlarmRow {
  readonly event = input.required<AlarmEvent>();
  /** Sent, and no answer from the broker yet. */
  readonly pending = input(false);
  readonly acknowledge = output<void>();

  protected readonly title = computed(() => alarmTitle(this.event()));
  protected readonly status = computed(() => alarmStatus(this.event()));
  protected readonly open = computed(() => canAcknowledge(this.event()));
}
