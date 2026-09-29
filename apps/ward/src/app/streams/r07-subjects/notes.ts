import { Component, signal } from '@angular/core';

// ============================================================================================
//  DAY 3 · R.7–8 · SUBJECT AND BEHAVIORSUBJECT
// ============================================================================================
//  So far the sources were given. A Subject is a source YOU push values into, with next(). It
//  is also an Observable, so the template can show it with the async pipe.
//  The page is ready: a text field, "Add note" (it calls add() with the text), an "Early" panel
//  that is always there, and a "Late" panel that only appears after "Show late panel".
//  [ts] = this file, [html] = notes.html. Subject and BehaviorSubject come from 'rxjs'.
//
//   [ts]   First add AsyncPipe (from @angular/common) to the component's imports.
//
//  R.7a · a Subject
//   [ts]   Create a protected field `notes$`: a new Subject of string.
//   [ts]   In add(), push the text into notes$ with next.
//
//  R.7b · show it
//   [html] In BOTH panels, show notes$ with the async pipe inside the <p class="note">.
//   Check: add "first", then "second": Early shows "second".
//
//  R.7c · late subscribers miss the past (no code)
//   Now click "Show late panel": Late stays EMPTY. Add "third": now both show it. A Subject
//   only passes on values that arrive while you are subscribed; Late subscribed after "second".
//
//  R.8a · a BehaviorSubject remembers the last value
//   [ts]   Replace the Subject with a new BehaviorSubject of string, whose starting value is
//          "(no notes yet)". Nothing else changes.
//   Check: reload. Early shows "(no notes yet)" at once. Add "first" and "second", then show
//   the late panel: Late shows "second" at once. A BehaviorSubject gives every new subscriber
//   the latest value.
//
//  R.8b · the value right now
//   [html] In the <p class="current">, show notes$.value — without the async pipe. A
//          BehaviorSubject (not a plain Subject) can tell you its current value at any moment.
//   Check: it shows the latest note, the same as the panels.
//
//  Spec: pnpm nx test ward --include='**/notes.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-notes',
  templateUrl: './notes.html',
  styleUrl: './notes.scss',
})
export default class Notes {
  protected readonly showLate = signal(false);

  /** Called by "Add note" with the text of the field. R.7a: push it into notes$. */
  protected add(text: string): void {
    void text;
  }
}
