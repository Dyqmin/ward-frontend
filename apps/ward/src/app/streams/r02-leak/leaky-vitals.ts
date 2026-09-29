import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MessageBus } from '@core/messaging/contract';

// ============================================================================================
//  DAY 3 · R.2–3 · THE LEAK, AND HOW TO FIX IT
// ============================================================================================
//  A subscription keeps running until someone ends it. Removing a component from the screen
//  does NOT end the subscriptions it started. The constructor below already has such a
//  subscription, with the leak in it: watch it grow first, then fix it.
//  [ts] = this file. Open /streams/r2; the counter "Active vitals subscriptions" at the top
//  right counts the open subscriptions to live vitals. Open the browser console (F12).
//
//  R.2a · watch it leak (no code)
//   1. Click Open: the counter shows 1, and the console gets one line per second
//      ("ICU-3 HR …"). That is the subscription in the constructor below.
//   2. Click Close. The component is gone from the page, but the counter STILL shows 1 and the
//      console keeps writing.
//   3. Click Open and Close four more times: the counter shows 5, and five lines arrive every
//      second. Leave the tab and come back: still 5.
//   That is a memory leak: every forgotten subscription keeps running, and keeps its component
//   in memory, until the page is reloaded.
//
//  R.2b · why? (no code)
//   Answer in a comment under this block: the component was destroyed; who told the
//   subscription to stop?
//
//  R.3 · stop when the component is destroyed
//   [ts]   In the constructor, between watch(…) and subscribe(…), add a pipe with
//          takeUntilDestroyed() (from @angular/core/rxjs-interop). It ends the subscription at
//          the moment this component is destroyed. It works here because the constructor runs
//          while the component is being created.
//   Check: reload the page. Open → the counter shows 1; Close → 0; the console stops.
//   Open/Close five times: it only goes 0 ↔ 1.
//
//  R.3b · see the leak in the console (optional, no test)
//   [ts]   Put trace('leaky') (from ../trace.ts) FIRST in the pipe, before takeUntilDestroyed().
//   Check: Open → "leaky subscribe" and "leaky next …" every second; Close → "leaky teardown":
//   the subscription ended. Take takeUntilDestroyed() out for a moment: Close shows NO
//   teardown — that missing line is what a leak looks like. Put it back.
//
//  Spec (R.3; R.2 is checked with the counter):
//    pnpm nx test ward --include='**/leaky-vitals.spec.ts' --reporters=verbose
// ============================================================================================

// R.2b: nobody. Destroying the component removes it from the page, but the subscription belongs
// to the stream, not to the component: it runs until someone calls unsubscribe.

@Component({
  selector: 'app-leaky-vitals',
  templateUrl: './leaky-vitals.html',
  styleUrl: './leaky-vitals.scss',
})
export class LeakyVitals {
  private readonly bus = inject(MessageBus);

  constructor() {
    this.bus
      .watch('/topic/vitals.ICU-3')
      .pipe(takeUntilDestroyed()) // R.3
      .subscribe((frame) => console.log(`ICU-3 HR ${frame.hr}`));
  }
}
