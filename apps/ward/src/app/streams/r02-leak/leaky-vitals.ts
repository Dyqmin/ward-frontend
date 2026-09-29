import { Component } from '@angular/core';

// ============================================================================================
//  DAY 3 · R.2–3 · THE LEAK, AND HOW TO FIX IT
// ============================================================================================
//  A subscription keeps running until someone ends it. Removing a component from the screen
//  does NOT end the subscriptions it started. Here you build a leak on purpose, watch it grow,
//  and then fix it.
//  [ts] = this file. Open /streams/r2; the counter "Active vitals subscriptions" at
//  the top right counts the open subscriptions to live vitals.
//
//  R.2a · subscribe, and forget to stop
//   [ts]   Inject MessageBus (from @core/messaging/contract) with inject() into a private field
//          `bus`.
//   [ts]   In the constructor, subscribe to the bus's watch() of the topic "/topic/vitals.ICU-3".
//          It sends one VitalsFrame per second. For every frame write with console.log
//          "ICU-3 HR <the frame's hr>".
//   Check: click Open: the counter shows 1 and the console gets one line per second.
//
//  R.2b · watch it leak
//   Click Close. The component is gone from the page, but the counter still shows 1 and the
//   console keeps writing. Click Open and Close four more times: the counter shows 5 and five
//   lines arrive every second. Leave the tab and come back: still 5. That is a memory leak:
//   every forgotten subscription keeps running, and keeps its component in memory, until the
//   page is reloaded.
//
//  R.2c · why? (no code)
//   Answer in a comment under this block: the component was destroyed; who told the
//   subscription to stop?
//
//  R.3 · stop when the component is destroyed
//   [ts]   Before subscribe, add a pipe with takeUntilDestroyed() (from
//          @angular/core/rxjs-interop). It ends the subscription at the moment this component is
//          destroyed. It must be called in the constructor (or a field), which is where your code
//          already is.
//   Check: reload the page. Open → the counter shows 1; Close → 0; the console stops.
//   Open/Close five times: it only goes 0 ↔ 1.
//
//  Spec (R.3 only; R.2 is checked with the counter):
//    pnpm nx test ward --include='**/leaky-vitals.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-leaky-vitals',
  templateUrl: './leaky-vitals.html',
  styleUrl: './leaky-vitals.scss',
})
export class LeakyVitals {}
