import { Component } from '@angular/core';

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
//  Spec: pnpm nx test ward --include='**/operators.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-operators',
  templateUrl: './operators.html',
  styleUrl: './operators.scss',
})
export default class Operators {}
