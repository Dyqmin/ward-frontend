import { ChangeDetectionStrategy, Component } from '@angular/core';

// ============================================================================================
//  DAY 3 · R.4–5 · WHY THE VIEW DOESN'T UPDATE, AND THE ASYNC PIPE
// ============================================================================================
//  This component uses OnPush (see @Component below), and the app runs without zone.js. Angular
//  re-renders an OnPush component only when it is told that something changed: a signal it
//  reads changed, an input changed, an event happened inside it, or the async pipe got a value.
//  A plain field set inside subscribe is none of these.
//  [ts] = this file, [html] = live-hr.html. Open /streams/r4.
//
//  R.4a · assign inside subscribe
//   [ts]   Inject MessageBus (from @core/messaging/contract) into a private field `bus`.
//   [ts]   In the constructor, subscribe to the bus's watch() of "/topic/vitals.ICU-3", with
//          takeUntilDestroyed() in a pipe before subscribe (as in R.3). For every frame:
//            - set the field hr (already in the class) to the frame's hr;
//            - write with console.log "R.4 HR <the frame's hr>".
//   Check: the console shows a new value every second, but the page keeps showing "HR: 0".
//
//  R.4b · why? (no code)
//   Answer in a comment under this block: which of the four things above would tell Angular
//   that hr changed? (None: that is the point.)
//
//  R.5a · an Observable instead of a field
//   [ts]   Delete the field hr and everything you wrote in the constructor.
//   [ts]   Create a protected field `hr$`: the bus's watch() of "/topic/vitals.ICU-3", piped
//          through map to the frame's hr. It is an Observable<number>; the $ at the end of the
//          name is a convention for "this is an Observable".
//
//  R.5b · the async pipe
//   [ts]   Add AsyncPipe (from @angular/common) to the component's imports.
//   [html] Show hr$ through the async pipe after "HR: ". The async pipe subscribes when the
//          component appears, tells Angular about every new value, and unsubscribes when the
//          component is destroyed.
//   Check: the number changes every second. Click another tab: the counter goes back to 0 —
//   no takeUntilDestroyed needed, the async pipe cleaned up by itself.
//
//  Spec (R.5 only; R.4 is checked in the browser):
//    pnpm nx test ward --include='**/live-hr.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-live-hr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-hr.html',
  styleUrl: './live-hr.scss',
})
export default class LiveHr {
  /** R.4: set it from inside subscribe. R.5: delete it. */
  protected hr = 0;
}
