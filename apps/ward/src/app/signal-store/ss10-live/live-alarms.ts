import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';

import {
  ALL_BEDS,
  MessageBus,
  bedsOf,
  isBedId,
  type AlarmEvent,
  type BedId,
} from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { Toasts } from '@core/ui/toasts';
import { MOCK_EMPTY_BEDS } from '../../testing/ward-fixtures';

// ============================================================================================
//  DAY 4 · SS.10–12 · THE REAL WARD: LIVE ALARMS
// ============================================================================================
//  Until now the data was fixed. Now the store talks to the broker through MessageBus, like the
//  rest of the app. Works with the real ward and with ?mock.
//  [store] = live-alarms.store.ts, [ts] = this file, [html] = live-alarms.html
//  To get an alarm: pick a bed, click "Raise HR to 140", wait a few seconds. "Back to 72" calms it.
//
//  SS.10 · load the active alarms (a request)
//   SS.10a [store] State: ward (Ward, starts 'ICU'), alarms (AlarmEvent[]), loading (boolean).
//          withProps: _bus: inject(MessageBus).
//   SS.10b [store] async load(): loading true → await the request → patch alarms, loading false.
//          The request: firstValueFrom(store._bus.request('/app/alarms.active', { ward: store.ward() }))
//   Tip: firstValueFrom turns an Observable into a Promise you can await.
//   SS.10c [store] withHooks: onInit calls store.load().
//   SS.10d [ts] Inject the store into `store`, delete `noAlarms`. [html] The three SS.10 comments.
//   Check: raise a test alarm, wait, click Reload: it shows up.
//
//  SS.11 · follow the ward live (a stream)
//   SS.11a [store] apply(event: AlarmEvent): replace the alarm with the same alarmId, or add the
//          event at the end if it's new.
//   Tip: like acknowledge in SS.2: map with a ternary. state.alarms.some(…) tells you if it's there.
//   SS.11b [store] A second withMethods with:
//          follow: rxMethod<Ward>(pipe(
//            switchMap((ward) => store._bus.watch(`/topic/alarms.${ward}`)),
//            tap((event) => store.apply(event)),
//          ))
//   SS.11c [store] onInit: also call store.follow(store.ward).
//   Check: raise a test alarm. It appears by itself, no Reload.
//
//  SS.12 · acknowledge (a command)
//   SS.12a [store] withProps: also _toasts: inject(Toasts). A method async acknowledge(alarmId: AlarmId):
//          const result = await firstValueFrom(store._bus.send('/app/alarms.ack', { alarmId }));
//          if result.status is not 'accepted': store._toasts.show(`Not acknowledged: ${result.status}`, 'warn').
//   SS.12b [html] On click of Acknowledge, call store.acknowledge(a.alarmId).
//   Tip: no patchState here. The broker broadcasts "acknowledged" on the ward's topic and follow()
//        applies it, on every screen in the room, not only yours.
//   Check: Acknowledge → a moment later the row says "acknowledged".
//
//  Spec: pnpm nx test ward --include='**/live-alarms.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-live-alarms',
  templateUrl: './live-alarms.html',
  styleUrl: './live-alarms.scss',
})
export default class LiveAlarms {
  /** SS.10d · delete me, loop over the store's alarms instead. */
  protected readonly noAlarms: AlarmEvent[] = [];

  // ---------- ready-made: the test alarm ----------
  private readonly bus = inject(MessageBus);
  private readonly toasts = inject(Toasts);
  protected readonly beds = bedsOf('ICU').filter(
    (b) => !MOCK_EMPTY_BEDS.includes(b),
  );
  protected readonly testBed = signal<BedId>('ICU-2');

  constructor() {
    if (this.bus instanceof FakeMessageBus) {
      // ?mock raises alarms only from vitals someone watches: keep every monitor running here.
      merge(...ALL_BEDS.map((bed) => this.bus.watch(`/topic/vitals.${bed}`)))
        .pipe(takeUntilDestroyed())
        .subscribe();
    }
  }

  protected pickBed(value: string): void {
    if (isBedId(value)) this.testBed.set(value);
  }

  /** The room game's heart-rate command: above 130 the ward raises "HR high" on that bed. */
  protected setHr(hr: number): void {
    const bed = this.testBed();
    this.bus.send('/app/monitor.set', { bed, hr }).subscribe({
      next: (r) =>
        r.status === 'accepted'
          ? this.toasts.show(`${bed}: HR set to ${hr}`, 'success')
          : this.toasts.show(`Test alarm refused (${r.status})`, 'warn'),
      error: () =>
        this.toasts.show('Test alarm: the broker did not answer', 'error'),
    });
  }
}
