import { Component, input } from '@angular/core';

import type { BedId } from '@core/messaging/contract';

// ============================================================================================
//  DAY 2 · THE VITALS CARD
// ============================================================================================
//  This card sits on the bed screen: open /ward, click a bed (e.g. ICU-3). Today you turn it
//  into a live monitor: HR, SpO₂ and RR every second, a live / stale chip, Pause and Full screen.
//
//  Do the steps in order. [ts] = this file, [html] = vitals-card.html (the template steps are
//  repeated there, where the markup goes). Styles are ready in vitals-card.scss.
//
//  Check with the spec (keep it running while you work):
//    pnpm nx test ward --include='**/vitals-card.spec.ts'
//  and in the browser: log in with ?mock, open ICU-3, use Dev → Simulate outage (8 s).
// ============================================================================================

// --------------------------------------------------------------------------------------------
//  PART 1 · SIGNALS
// --------------------------------------------------------------------------------------------
//
//  EXERCISE 1.1 · Live data
//   [ts]   Inject MessageBus (from @core/messaging/contract).
//   [ts]   Create a resource `vitals` with the live data of `bed`:
//            - it depends on `bed`: when the bed changes, it switches to the new bed by itself;
//            - its stream is the bus's watch() of the topic /topic/vitals.<bed>, one frame per
//              second;
//            - each value holds the frame AND the time it arrived (Date.now()), as `frame`
//              and `at`.
//          The resource API for streams is in @angular/core/rxjs-interop.
//   [html] While the resource has a value: show the HR, SpO₂ and RR of its frame as text.
//          Before the first value: show a skeleton loader with 3 rows
//          (NgxSkeletonLoaderComponent from 'ngx-skeleton-loader').
//   Check: the three numbers change every second.
//
//  EXERCISE 1.2 · How old is the data
//   [ts]   Inject Clock (from @core/clock). Its `now` is a signal with the current time that
//          updates every second. Don't start your own timer.
//   [ts]   Create a computed `ageSec`: the whole seconds between now and the time the latest
//          frame arrived; null while there is no frame.
//   Check: show ageSec in the template for a moment; it stays at 0–1 while data flows.
//
//  EXERCISE 1.3 · Stale or live
//   [ts]   Create a computed `stale`: true when the bus is not connected (the bus has a
//          `connected` signal), or when ageSec is bigger than STALE_AFTER_SEC
//          (from ../../../ui/format). No frame yet counts as age 0.
//   [html] In the heading, once there is a frame, show one chip:
//            stale → class "chip warn", text "no data for N s" (N = ageSec)
//            live  → class "chip ok",   text "live"
//   Check: Simulate outage → "no data for N s", counting up; "live" again after the outage.
//
//  EXERCISE 1.4a · The Pause button
//   [ts]   Create a writable signal `paused`, false at the start.
//   [html] In the heading, after the chip, add one button (type "button"):
//            its text is "Pause" while paused is false and "Resume" while it is true;
//            a click switches paused to the other value.
//   Check: the button switches between Pause and Resume. The numbers don't stop yet.
//
//  EXERCISE 1.4b · Freeze the numbers
//   [ts]   Create `shown`: the frame whose numbers are on screen.
//            - running (paused is false): the latest frame;
//            - paused: the frame that was on screen at the moment Pause was clicked.
//          It depends on two things, the latest frame and paused, and has to remember its own
//          previous value. Use the signal type made for exactly that. The click handler from
//          1.4a stays as it is: it only switches paused.
//   [html] Show the numbers from shown instead of the latest frame.
//   [html] While paused, show a chip with class "chip" and text "paused" instead of the
//          live / stale chip.
//   Check: after Pause the numbers stop (the chart keeps moving); after Resume they jump on.
//
//  EXERCISE 1.5 · Warn when the data goes stale
//   [ts]   Inject Toasts (from @core/ui/toasts).
//   [ts]   Every time stale becomes true, show a warning toast with the text
//          "<bed>: no live vitals" (e.g. "ICU-3: no live vitals"); Toasts.show(text, kind)
//          takes the kind 'warn'. This is a side effect that reacts to a signal: set it up in
//          the constructor.
//          Only stale may decide when it runs: reading bed for the text must not be tracked.
//   Check: one outage → exactly one toast.
//
// --------------------------------------------------------------------------------------------
//  PART 2 · COMPONENT API
// --------------------------------------------------------------------------------------------
//
//  EXERCISE 2.1 is in ../vital-reading/vital-reading.ts. Do it first, then come back here.
//
//  EXERCISE 2.2 · Readings and alarms
//   [html] Replace the HR / SpO₂ / RR text with three VitalReading components
//          (../vital-reading/vital-reading), inside a div with class "now":
//            HR:   label "HR",   vital hr,   unit "bpm"
//            SpO₂: label "SpO₂", vital spo2, unit "%"
//            RR:   label "RR",   vital rr,   unit "/min"
//          Each gets its value from shown and gets stale.
//   [ts]   Create an input `alarms`: a list of AlarmView (from ../../../data/alarms-store),
//          empty by default.
//   [html] After the chip, one chip per alarm: class "chip", plus class "bad" when the alarm is
//          urgent; text "<title> · <status>". alarmTitle() and isUrgent() are in
//          ../../../ui/format; the status is the alarm's event.status.
//   [html] In ../../bed-detail.html pass the page's alarms to the card.
//   Check: the spec's "Exercise 2.2" tests; ICU-3 shows its alarm chips.
//
//  EXERCISE 2.3 · Pause, owned by the parent
//   [ts]   Turn paused into an input (false by default). The card can't change it anymore.
//   [ts]   Create an output `pausedChange` that sends a boolean.
//   [html] The button no longer changes paused: it sends the new value through pausedChange
//          (true after Pause, false after Resume).
//   [ts]   In ../../bed-detail.ts create the state: a signal `paused`, false at the start.
//   [html] In ../../bed-detail.html pass that signal into the card, and update it whenever the
//          card sends pausedChange.
//   Check: the spec's "Exercise 2.3" test; Pause still works in the browser.
//   Note: the "Exercise 1.4" test goes red now, because the card can't change paused by itself.
//   That is expected: 2.4 turns it green again.
//
//  EXERCISE 2.4 · Pause, two-way
//   [ts]   Replace the paused input AND the pausedChange output with ONE member `paused` that
//          the parent can bind in both directions and the card can also write.
//   [html] The button switches paused directly again.
//   [html] In ../../bed-detail.html replace the two bindings from 2.3 with one two-way binding.
//   Check: the spec's "Exercise 2.4" tests, and 2.3 stays green: from outside, the API is the
//   same as before.
//
//  EXERCISE 2.5 · Full screen
//   [html] Add a button "Full screen" next to Pause.
//   [ts]   A click shows the card's <section class="card vitals"> full screen (the DOM method
//          requestFullscreen()). Get hold of that element from the class through the template,
//          without document.querySelector.
//   Check: the spec's "Exercise 2.5" test; the button shows the card full screen.
//
//  PART 3 continues in ../vitals-panel/vitals-panel.ts.
// ============================================================================================

@Component({
  selector: 'app-vitals-card',
  templateUrl: './vitals-card.html',
  styleUrl: './vitals-card.scss',
})
export class VitalsCard {
  /** Which bed to show. The bed screen passes it: <app-vitals-card [bed]="patient().bed">. */
  readonly bed = input.required<BedId>();
}
