import { Component, computed, inject, linkedSignal } from '@angular/core';

import { MessageBus } from '../messaging/contract';
import { STOMP_MODE } from '../messaging/stomp-mode';

@Component({
  selector: 'app-connection-badge',
  template: `
    @if (mock) {
      <span class="chip warn" title="In-memory fake broker (?mock)">MOCK</span>
    }
    <span class="chip badge" [class]="bus.state()" role="status">
      <span class="dot"></span>
      {{ text() }}
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      gap: 0.4rem;
    }
    .badge {
      font-weight: 600;
    }
    .dot {
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 50%;
      background: currentColor;
    }
    .open {
      color: var(--ok);
      border-color: var(--ok);
    }
    .connecting {
      color: var(--warn);
      border-color: var(--warn);
    }
    .connecting .dot {
      animation: pulse 0.8s infinite;
    }
    .closed {
      color: var(--bad);
      border-color: var(--bad);
      background: color-mix(in srgb, var(--bad) 15%, transparent);
    }
  `,
})
export class ConnectionBadge {
  protected readonly bus = inject(MessageBus);
  protected readonly mock = inject(STOMP_MODE) === 'mock';
  /** When the current state began. */
  private readonly since = linkedSignal({ source: this.bus.state, computation: () => new Date() });

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
