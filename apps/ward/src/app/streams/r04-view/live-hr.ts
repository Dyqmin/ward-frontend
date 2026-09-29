import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MessageBus } from '@core/messaging/contract';

// ============================================================================================
//  DAY 3 · R.4–5 · WHY THE VIEW DOESN'T UPDATE, AND THE ASYNC PIPE
// ============================================================================================
//  This component uses OnPush (see @Component below), and the app runs without zone.js. Angular
//  re-renders an OnPush component only when it is told that something changed: a signal it
//  reads changed, an input changed, an event happened inside it, or the async pipe got a value.
//  A plain field set inside subscribe is none of these.
//  The constructor below already sets such a field from a subscription: watch it fail first,
//  then fix it. [ts] = this file, [html] = live-hr.html. Open /streams/r4 and the browser
//  console (F12).
//
//  R.4a · watch the view stay still (no code)
//   The console shows "R.4 HR …" with a new value every second: the subscription works and
//   the field hr really changes. But the page keeps showing "HR: 0".
//
//  R.4b · why? (no code)
//   Answer in a comment under this block: which of the four things above would tell Angular
//   that hr changed? (None: that is the point.)
//
//  R.5a · an Observable instead of a field
//   [ts]   Delete the field hr and the whole constructor.
//   [ts]   Create a protected field `hr$`: the bus's watch() of "/topic/vitals.ICU-3", piped
//          through map (from 'rxjs') to the frame's hr. It is an Observable<number>; the $ at
//          the end of the name is a convention for "this is an Observable".
//
//  R.5b · the async pipe
//   [ts]   Add AsyncPipe (from @angular/common) to the component's imports.
//   [html] Replace {{ hr }} with hr$ through the async pipe. The async pipe subscribes when the
//          component appears, tells Angular about every new value, and unsubscribes when the
//          component is destroyed.
//   Check: the number changes every second. Click another tab: the counter goes back to 0 —
//   no takeUntilDestroyed needed, the async pipe cleaned up by itself.
//
//  Spec (R.5; R.4 is checked in the browser):
//    pnpm nx test ward --include='**/live-hr.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-live-hr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-hr.html',
  styleUrl: './live-hr.scss',
})
export default class LiveHr {
  private readonly bus = inject(MessageBus);
  protected hr = 0;

  constructor() {
    // Ready-made (R.4): the field changes, the view doesn't. R.5: replace it.
    this.bus
      .watch('/topic/vitals.ICU-3')
      .pipe(takeUntilDestroyed())
      .subscribe((frame) => {
        this.hr = frame.hr;
        console.log(`R.4 HR ${frame.hr}`);
      });
  }
}
