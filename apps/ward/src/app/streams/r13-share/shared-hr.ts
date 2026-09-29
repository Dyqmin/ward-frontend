import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { map, shareReplay } from 'rxjs';

import { MessageBus } from '@core/messaging/contract';

// ============================================================================================
//  DAY 3 · R.13 · SHAREREPLAY: ONE SOURCE FOR MANY LISTENERS
// ============================================================================================
//  Every subscribe starts the source again (you saw it in R.1c). The template below uses hr$
//  twice, so the two async pipes are two subscriptions: two connections to the same bed. With
//  a server that means twice the traffic; with 18 tiles it adds up fast.
//  shareReplay makes all subscribers share ONE subscription to the source, and replays the
//  latest value to anyone who subscribes later.
//  [ts] = this file. Everything else is ready. Open /streams/r13.
//
//  R.13a · count (no code)
//   Look at the counter at the top right: 2, although it is one bed.
//
//  R.13b · share it
//   [ts]   In hr$, after map, add shareReplay (from 'rxjs') with an options object:
//            bufferSize 1  — keep the latest value, to give it to late subscribers;
//            refCount true — when the LAST subscriber is gone, unsubscribe from the source.
//   Check: the counter shows 1; both numbers still change together.
//
//  R.13c · why refCount (no code)
//   Click another tab: the counter goes to 0. Without refCount it would stay at 1 after
//   leaving: shareReplay would keep its own subscription alive forever — a leak again.
//   Try it: remove refCount, leave the tab, look at the counter. Then put it back.
//
//  Spec: pnpm nx test ward --include='**/shared-hr.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-shared-hr',
  imports: [AsyncPipe],
  templateUrl: './shared-hr.html',
  styleUrl: './shared-hr.scss',
})
export default class SharedHr {
  private readonly bus = inject(MessageBus);

  protected readonly hr$ = this.bus.watch('/topic/vitals.ICU-3').pipe(
    map((frame) => frame.hr),
    shareReplay({ bufferSize: 1, refCount: true }), // R.13b
  );
}
