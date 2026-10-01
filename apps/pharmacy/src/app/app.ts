import { Component, computed, signal } from '@angular/core';

import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  StatTile,
} from '@wm/shared/ui-design-system';

import { DISPENSING_QUEUE } from './dispensing-queue';

/**
 * Pharmacy desk: another team's app in the same monorepo. It prepares the medication that
 * doctors order in Ward Monitor, with the same design system as the ward app.
 */
@Component({
  selector: 'ph-root',
  imports: [Badge, Card, EmptyState, PageHeader, StatTile],
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
