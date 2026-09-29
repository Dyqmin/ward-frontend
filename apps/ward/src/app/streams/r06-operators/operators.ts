import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { distinctUntilChanged, filter, take, tap } from 'rxjs';

import { simpleTrace } from '../simple-trace';
import { hrSamples$ } from '../streams-data';
import { toBpmText } from '../to-bpm-text';
import { trace } from '../trace';

// ============================================================================================
//  DAY 3 · R.6 · OPERATORS
// ============================================================================================
//  An operator takes an Observable and gives back a new one, changed in one way. You chain
//  them inside pipe(). The source here is hrSamples$ from ../streams-data.ts: it sends these
//  heart rates, one per second, then completes:  72, 118, 75, 75, 131, 64, 64, 99.
//  Each step makes its OWN new field from hrSamples$ (every async pipe starts it from the
//  beginning). Operators come from 'rxjs'.
//  [ts] = this file, [html] = operators.html. Reload the page to start the samples again.
//
//   [ts]   First add AsyncPipe (from @angular/common) to the component's imports.
//
//  R.6a · map: change every value
//   [ts]   Create a protected field `hrText$`: hrSamples$ piped through map into the text
//          "HR <value> bpm", e.g. "HR 72 bpm".
//   [html] Show hrText$ with the async pipe in the <p class="r6a">.
//   Check: the text changes every second, the last one is "HR 99 bpm".
//
//  R.6b · filter: let only some values through
//   [ts]   Create a protected field `highHr$`: hrSamples$ piped through filter, keeping only the
//          values above 100.
//   [html] Show it in the <p class="r6b">.
//   Check: it shows 118, and later 131. The others never arrive.
//
//  R.6c · take: only the first few, then stop
//   [ts]   Create a protected field `firstThree$`: hrSamples$ piped through take, with 3.
//   [html] Show it in the <p class="r6c">.
//   Check: 72, 118, 75 — then it stops at 75: after three values, take completes the stream.
//
//  R.6d · distinctUntilChanged and tap: skip repeats, look inside
//   [ts]   Create a protected field `distinct$`: hrSamples$ piped through
//            - distinctUntilChanged: a value equal to the one right before it is skipped;
//            - then tap: it runs a function for every value WITHOUT changing it; use it to
//              write "R.6d <value>" with console.log.
//   [html] Show it in the <p class="r6d">.
//   Check: the console shows 72, 118, 75, 131, 64, 99: the second 75 and the second 64 were
//   skipped.
//
//  R.6e · your own operator
//   [new file ../to-bpm-text.ts] Export a function `toBpmText` with no parameters. It does not
//          take the stream: it RETURNS an operator — the same map you wrote in R.6a.
//          Return type: OperatorFunction<number, string> (from 'rxjs'): numbers in, text out.
//          You may leave the return type out; TypeScript infers it.
//          ../trace.ts has the same shape: a function that returns an operator (tap there).
//   [ts]   In hrText$, use toBpmText() instead of your own map.
//   Check: the R.6a test stays green, and the page shows the same texts as before.
//
//  R.6f · look inside a filter (optional, no test)
//   [ts]   In highHr$, put trace('in') (from ../trace.ts) before filter and trace('out') after
//          it.
//   Check: the console shows "in next 72" but no "out next 72": the filter stopped it. For 118
//   you see both "in next 118" and "out next 118".
//
//  R.6g · stretch: your own trace
//   [new file ../simple-trace.ts] Export a function `simpleTrace` with a parameter `label`
//          (type string) that returns tap, writing
//          "<label> <value>" with console.log for every value.
//   [ts]   In highHr$, use simpleTrace('out') instead of trace('out'), then compare the console
//          with ../trace.ts: what does the ready-made one show that yours doesn't?
//
//  Spec: pnpm nx test ward --include='**/operators.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-operators',
  imports: [AsyncPipe],
  templateUrl: './operators.html',
  styleUrl: './operators.scss',
})
export default class Operators {
  protected readonly hrText$ = hrSamples$.pipe(toBpmText()); // R.6a, then R.6e
  protected readonly highHr$ = hrSamples$.pipe(
    // R.6b, with R.6f and R.6g
    trace('in'),
    filter((hr) => hr > 100),
    simpleTrace('out'),
  );
  protected readonly firstThree$ = hrSamples$.pipe(take(3)); // R.6c
  protected readonly distinct$ = hrSamples$.pipe(
    // R.6d
    distinctUntilChanged(),
    tap((hr) => console.log(`R.6d ${hr}`)),
  );
}
