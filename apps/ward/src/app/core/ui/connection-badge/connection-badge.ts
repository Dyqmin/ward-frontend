import { Component, computed, inject, linkedSignal } from '@angular/core';

import { STOMP_MODE } from '@wm/shared/data-access-auth';
import { MessageBus } from '@wm/shared/data-access-messaging';

@Component({
  selector: 'app-connection-badge',
  templateUrl: './connection-badge.html',
  styleUrl: './connection-badge.scss',
})
export class ConnectionBadge {
  protected readonly bus = inject(MessageBus);
  protected readonly mock = inject(STOMP_MODE) === 'mock';
  /** When the current state began. */
  private readonly since = linkedSignal({
    source: this.bus.state,
    computation: () => new Date(),
  });

  protected readonly text = computed(() => {
    const since = this.since().toLocaleTimeString();
    switch (this.bus.state()) {
      case 'open':
        return 'Live';
      case 'connecting':
        return 'Reconnecting…';
      case 'closed':
        return `Offline since ${since}`;
    }
  });
}
