import { Component } from '@angular/core';

// ============================================================================================
//  DAY 3 · R.1 · SUBSCRIBE AND NEXT
// ============================================================================================
//  An Observable is a source of values over time. It does NOTHING until someone subscribes:
//  subscribe starts it, and every value it produces arrives in your `next` function.
//  Everything here happens in the browser console: open it (F12 → Console).
//  [ts] = this file. The source ticks$ is ready in ../streams-data.ts: it sends 1, 2, 3, 4, 5,
//  one number per second, and then completes.
//
//  R.1a · next
//   [ts]   In the constructor, subscribe to ticks$. Give subscribe an object with a `next`
//          function: it receives each number and writes it with console.log as "A: <number>",
//          e.g. "A: 1".
//   Check: the console shows A: 1 … A: 5, one per second.
//
//  R.1b · complete
//   [ts]   Add a `complete` function to the same object: it writes "A: done".
//   Check: after A: 5 the console shows A: done. After complete, nothing more will arrive.
//
//  R.1c · every subscribe starts its own run
//   [ts]   Under the first subscribe, subscribe to ticks$ a second time, in the same way, but
//          writing "B: <number>" and "B: done".
//   Check: A and B both count from 1 and run side by side: the second subscribe did not join
//   the first one, it started the source again.
//   Try: put the whole constructor in a comment. Nothing is written at all: without subscribe,
//   an Observable does nothing.
//
//  R.1d · look inside (optional, no test)
//   [ts]   In the first subscription, put trace('A') (from ../trace.ts) in a pipe before
//          subscribe. trace() is a ready-made operator that writes to the console what happens
//          at that point of the stream.
//   Check: besides "A: 1" … the console shows "A subscribe", then "A next 1" … "A next 5",
//   "A complete" and "A teardown": the whole life of one subscription.
//
//  Spec: pnpm nx test ward --include='**/subscribe-basics.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-subscribe-basics',
  templateUrl: './subscribe-basics.html',
  styleUrl: './subscribe-basics.scss',
})
export default class SubscribeBasics {}
