import { Component } from '@angular/core';

import type { BedId } from '@core/messaging/contract';
import { requestsSent } from '../streams-data';

// ============================================================================================
//  DAY 3 · R.10–12 · SWITCHMAP, MERGEMAP, EXHAUSTMAP
// ============================================================================================
//  Sometimes every value of one stream must START another stream: a click on a bed starts
//  watching that bed; a click on a button starts a request. The *Map operators do that, and
//  they differ in one thing: what happens to the previous inner stream when a new value
//  arrives.
//    switchMap  — stops the previous one, starts the new one   (the latest wins)
//    mergeMap   — keeps all of them running at the same time
//    exhaustMap — ignores new values while one is still running
//    concatMap  — waits for the previous one to finish, then starts the next
//  [ts] = this file, [html] = flattening.html. Operators and subjects come from 'rxjs'.
//
//   [ts]   First add AsyncPipe (from @angular/common) to the component's imports, and inject
//          MessageBus (from @core/messaging/contract) into a private field `bus`.
//
//  R.10a · the selected bed
//   [ts]   Create a protected field `selectedBed$`: a new BehaviorSubject of BedId, starting
//          with 'ICU-1'.
//   [html] The bed buttons are ready: on click, push the button's bed into selectedBed$.
//
//  R.10b · switchMap: watch the selected bed
//   [ts]   Create a protected field `live$`: selectedBed$ piped through
//            - switchMap: for each bed, the bus's watch() of "/topic/vitals.<bed>";
//            - then map: each frame into the text "<frame's bed>: <frame's hr>", e.g. "ICU-2: 74".
//   [html] Show live$ with the async pipe in the <p class="live">.
//   Check: click quickly between the beds: the text always shows the bed you clicked LAST, and
//   the counter stays at 1: switchMap unsubscribed from the previous bed.
//
//  R.11 · mergeMap: the same, wrongly (then undo)
//   [ts]   In live$, replace switchMap with mergeMap.
//   Check: click ICU-1, ICU-2, ICU-3: the counter grows with each click (3 after three beds).
//   Every bed you ever clicked is still being watched and its data still downloaded, although
//   only one is on screen: a leak. (The text may still look right: in the mock ward all beds
//   send at the same moment and the last one wins; with a real server they can also jump.)
//   [ts]   Put switchMap back, and write in a comment in one sentence why switchMap is right
//          for "the selected bed".
//
//  R.12a · a slow command, with mergeMap
//   [ts]   Create a protected field `ackClicks$`: a new Subject of void.
//   [html] The "Acknowledge" button is ready: on click, call next() on ackClicks$.
//   [ts]   Create a protected field `ack$`: ackClicks$ piped through mergeMap into acknowledge()
//          (from ../streams-data): each call is ONE request that answers "acknowledged" after
//          1 second.
//   [html] Show ack$ with the async pipe in the <p class="ack">. "Requests sent" is ready.
//   Check: click Acknowledge 5 times quickly: "Requests sent" goes up by 5. One nurse, one
//   alarm, five requests to the server.
//
//  R.12b · exhaustMap: one at a time, ignore the rest
//   [ts]   In ack$, replace mergeMap with exhaustMap.
//   Check: reload, click 5 times quickly: "Requests sent" goes up by 1. Wait for
//   "acknowledged", click again: +1. Clicks during a running request are ignored.
//
//  R.12c · stretch: concatMap
//   Try concatMap instead: 5 quick clicks → 5 requests, but one after another (5 seconds).
//   When would that be the right choice?
//
//  Spec: pnpm nx test ward --include='**/flattening.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-flattening',
  templateUrl: './flattening.html',
  styleUrl: './flattening.scss',
})
export default class Flattening {
  protected readonly beds: readonly BedId[] = [
    'ICU-1',
    'ICU-2',
    'ICU-3',
    'ICU-4',
  ];
  protected readonly requestsSent = requestsSent;
}
