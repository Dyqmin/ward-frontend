import { Component, computed, inject, linkedSignal } from '@angular/core';

import { MessageBus } from '../messaging/contract';
import { STOMP_MODE } from '../messaging/stomp-mode';

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
