import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { merge } from 'rxjs';

import {
  ALL_BEDS,
  MessageBus,
  isBedId,
  type BedId,
} from '@core/messaging/contract';
import { STOMP_MODE } from '@core/messaging/stomp-mode';
import { MOCK_EMPTY_BEDS } from '../testing/ward-fixtures';
import { StoreInspector } from './store-inspector';

/** Ready-made: the Day 4 page with one tab per exercise and the Store inspector. */
@Component({
  selector: 'app-state-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, StoreInspector],
  templateUrl: './state-shell.html',
  styleUrl: './state-shell.scss',
})
export default class StateShell {
  private readonly bus = inject(MessageBus);
  protected readonly mock = inject(STOMP_MODE) === 'mock';

  protected readonly tabs = [
    { path: 's1', label: 'S.1 look' },
    { path: 's2', label: 'S.2 ward' },
    { path: 's3', label: 'S.3 selectors' },
    { path: 's4', label: 'S.4–8 alarms' },
  ];

  /** Occupied beds of the in-memory ward, for the test alarm. */
  protected readonly beds = ALL_BEDS.filter(
    (b) => !MOCK_EMPTY_BEDS.includes(b),
  );
  protected readonly testBed = signal<BedId>('ICU-2');

  constructor() {
    if (this.mock) {
      // The in-memory ward raises alarms only from the vitals someone watches (the real
      // ward-worker raises them on its own). Keep every monitor running while this page is open.
      merge(...ALL_BEDS.map((bed) => this.bus.watch(`/topic/vitals.${bed}`)))
        .pipe(takeUntilDestroyed())
        .subscribe();
    }
  }

  protected pickBed(value: string): void {
    if (isBedId(value)) this.testBed.set(value);
  }

  /** The room game's heart-rate slider: above 130 the ward raises "HR high" within a second. */
  protected setHr(hr: number): void {
    this.bus.send('/app/monitor.set', { bed: this.testBed(), hr }).subscribe();
  }
}
