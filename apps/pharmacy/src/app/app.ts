import { Component, computed, signal } from '@angular/core';

import { DISPENSING_QUEUE } from './dispensing-queue';

/**
 * Pharmacy desk: another team's app in the same monorepo. It prepares the medication that
 * doctors order in Ward Monitor. It has no libraries of its own yet: the card, the badge and
 * the page header in app.html are copied by hand, with their styles in app.scss.
 */
@Component({
  selector: 'ph-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly orders = signal(DISPENSING_QUEUE);
  protected readonly toPrepare = computed(() =>
    this.orders().filter((o) => o.status === 'ordered'),
  );
  protected readonly done = computed(
    () => this.orders().length - this.toPrepare().length,
  );

  protected time(iso: string): string {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
