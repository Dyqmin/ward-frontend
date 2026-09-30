import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RxStomp } from '@stomp/rx-stomp';
import { merge } from 'rxjs';

import {
  ALL_BEDS,
  MessageBus,
  isBedId,
  type BedId,
} from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { STOMP_MODE } from '@core/messaging/stomp-mode';
import { Toasts } from '@core/ui/toasts';
import { MOCK_EMPTY_BEDS } from '../testing/ward-fixtures';
import { StoreInspector } from './store-inspector';

const OUTAGE_MS = 8_000;

/**
 * Ready-made: the Day 4 page with one tab per exercise, the Store inspector and two lab helpers
 * that work with the real broker and with ?mock: a test alarm and a short outage.
 */
@Component({
  selector: 'app-state-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, StoreInspector],
  templateUrl: './state-shell.html',
  styleUrl: './state-shell.scss',
})
export default class StateShell {
  private readonly bus = inject(MessageBus);
  private readonly toasts = inject(Toasts);
  private readonly mock = inject(STOMP_MODE) === 'mock';
  /** The real socket; never created in mock mode (injecting it would open one). */
  private readonly stomp = this.mock ? null : inject(RxStomp);

  protected readonly tabs = [
    { path: 's1', label: 'S.1 look' },
    { path: 's2', label: 'S.2 ward' },
    { path: 's3', label: 'S.3 selectors' },
    { path: 's4', label: 'S.4–8 alarms' },
  ];

  /** Beds with a patient (the same three stay empty on the real ward and in ?mock). */
  protected readonly beds = ALL_BEDS.filter(
    (b) => !MOCK_EMPTY_BEDS.includes(b),
  );
  protected readonly testBed = signal<BedId>('ICU-2');
  protected readonly outageRunning = signal(false);

  constructor() {
    if (this.mock) {
      // The in-memory ward raises alarms only from the vitals someone watches (ward-worker raises
      // them on the server). Keep every monitor running while this page is open.
      merge(...ALL_BEDS.map((bed) => this.bus.watch(`/topic/vitals.${bed}`)))
        .pipe(takeUntilDestroyed())
        .subscribe();
    }
  }

  protected pickBed(value: string): void {
    if (isBedId(value)) this.testBed.set(value);
  }

  /**
   * The room game's heart-rate command: above 130 the ward raises "HR high" on that bed. The
   * broker may refuse it (e.g. a bed nobody plays in the room game); the toast says why.
   */
  protected setHr(hr: number): void {
    const bed = this.testBed();
    this.bus.send('/app/monitor.set', { bed, hr }).subscribe({
      next: (r) => {
        switch (r.status) {
          case 'accepted':
            return this.toasts.show(`${bed}: HR set to ${hr}`, 'success');
          case 'forbidden':
            return this.toasts.show(`Test alarm refused: ${r.reason}`, 'warn');
          default:
            return this.toasts.show(`Test alarm refused (${r.status})`, 'warn');
        }
      },
      error: () =>
        this.toasts.show('Test alarm: the broker did not answer', 'error'),
    });
  }

  /** Drops THIS browser's connection to the broker for 8 s, then reconnects. Nobody else notices. */
  protected outage(): void {
    this.outageRunning.set(true);
    const end = () => this.outageRunning.set(false);
    if (this.bus instanceof FakeMessageBus) {
      this.bus.simulateOutage(OUTAGE_MS);
      setTimeout(end, OUTAGE_MS);
      return;
    }
    void this.stomp?.deactivate().then(() =>
      setTimeout(() => {
        this.stomp?.activate();
        end();
      }, OUTAGE_MS),
    );
  }
}
