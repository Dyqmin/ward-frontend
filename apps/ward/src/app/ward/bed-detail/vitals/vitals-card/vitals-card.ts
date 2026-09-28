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
//   Goal: the card shows the live HR, SpO₂ and RR of its bed.
//   [ts]   Inject MessageBus (from @core/messaging/contract) into a private field `bus`.
//   [ts]   Create an rxResource `vitals` (rxResource is in @angular/core/rxjs-interop):
//            - params: the value of the `bed` input, so the resource restarts by itself when
//              the bed changes;
//            - stream: the bus's watch() of the topic "/topic/vitals.<bed>", using the bed from
//              params. It emits one VitalsFrame per second;
//            - map every frame (rxjs map) to an object with two fields: `frame` (the frame
//              itself) and `at` (Date.now(): the moment it arrived).
//   [html] If vitals has a value: a paragraph with the hr, spo2 and rr of the value's frame,
//          e.g. "HR 72 · SpO₂ 97 · RR 14".
//          Otherwise: an ngx-skeleton-loader with count 3. Add NgxSkeletonLoaderComponent (from
//          'ngx-skeleton-loader') to the component's imports.
//   Check: the three numbers change every second.
//
//  EXERCISE 1.2 · How old is the data
//   Goal: the card knows how many seconds ago the last frame arrived.
//   [ts]   Inject Clock (from @core/clock) and keep its `now` signal in a private field `now`.
//          `now` holds the current time in milliseconds and updates every second. Don't start
//          your own timer.
//   [ts]   Create a computed `ageSec` (type number | null):
//            - vitals has no value → null;
//            - otherwise → now minus the value's `at`, divided by 1000, rounded to whole
//              seconds, and never below 0. (The clock ticks once a second, so right after a
//              frame arrives, now can be slightly EARLIER than `at`.)
//   Check: show ageSec in the template for a moment; it stays at 0–1 and is never negative.
//   (No spec test for 1.2: 1.3 builds on it.)
//
//  EXERCISE 1.3 · Stale or live
//   Goal: the card says clearly when its numbers are old.
//   [ts]   Create a computed `stale` (type boolean). It is true when:
//            - the bus's `connected` signal is false, OR
//            - ageSec is greater than STALE_AFTER_SEC (from ../../../ui/format).
//          Treat an ageSec of null as 0.
//   [html] In the heading, once vitals has a value, show exactly one chip:
//            stale is true → a span with class "chip warn" and the text "no data for N s",
//                            where N is ageSec;
//            otherwise     → a span with class "chip ok" and the text "live".
//   Check: Simulate outage → "no data for N s", counting up; "live" again after the outage.
//
//  EXERCISE 1.4a · The Pause button
//   Goal: a nurse can pause the card to read the numbers out.
//   [ts]   Create a signal `paused` (type boolean), initial value false.
//   [html] In the heading, after the chip, one button with type "button":
//            - its text is "Pause" while paused is false, "Resume" while paused is true;
//            - a click sets paused to the opposite of its current value.
//   Check: in the browser only: the button switches between Pause and Resume, the numbers
//   don't stop yet. The spec test for pause turns green after 1.4b.
//
//  EXERCISE 1.4b · Freeze the numbers
//   Goal: while paused, the three numbers stay the same; the chart keeps moving.
//   [ts]   Create a linkedSignal `shown` (type VitalsFrame | undefined): the frame whose HR, SpO₂
//          and RR the card displays.
//            - source: an object with two fields: the latest frame (the frame of vitals' value,
//              or undefined while vitals has no value) and the current value of paused;
//            - computation: gets that source and the previous state. If paused is true and there
//              is a previous value, return the previous value (the frozen frame). In every other
//              case, return the latest frame.
//          Why not a computed: a computed can't see its own previous value, so it can't keep a
//          frame while paused. The button from 1.4a stays as it is: it only flips paused.
//   [html] Take the three numbers from shown instead of from vitals' value.
//   [html] While paused is true, show a span with class "chip" and the text "paused" instead of
//          the live / stale chip (like that chip: only once vitals has a value).
//   Check: after Pause the numbers stop (the chart keeps moving); after Resume they jump on.
//
//  EXERCISE 1.5 · Warn when the data goes stale
//   Goal: a nurse who looks away still hears about lost data.
//   [ts]   Inject Toasts (from @core/ui/toasts) into a private field `toasts`.
//   [ts]   Add a constructor and create an effect in it:
//            - it reads stale; while stale is false it does nothing;
//            - when stale is true it calls toasts.show with the text "<bed>: no live vitals"
//              (e.g. "ICU-3: no live vitals") and the kind 'warn';
//            - make that toasts.show call inside untracked, so that reading bed does not become
//              a dependency of the effect: only a change of stale may run it again.
//   Check: one outage → exactly one toast.
//
// --------------------------------------------------------------------------------------------
//  PART 2 · COMPONENT API
// --------------------------------------------------------------------------------------------
//
//  EXERCISE 2.1 is in ../vital-reading/vital-reading.ts. Do it first, then come back here.
//
//  EXERCISE 2.2 · Readings and alarms
//   Goal: the numbers look like a monitor, and the card shows the bed's alarms.
//   [ts]   Add VitalReading (from ../vital-reading/vital-reading) to the component's imports.
//   [html] Replace the paragraph from 1.1 with a div with class "now" holding three
//          app-vital-reading elements. Set their inputs:
//            HR:   label "HR",   vital "hr",   unit "bpm",  value: hr of shown
//            SpO₂: label "SpO₂", vital "spo2", unit "%",    value: spo2 of shown
//            RR:   label "RR",   vital "rr",   unit "/min", value: rr of shown
//          and give all three the card's stale.
//   [ts]   Create an input `alarms` (type readonly AlarmView[], from
//          ../../../data/alarms-store), default an empty array.
//   [ts]   Add two protected fields that point to the functions alarmTitle and isUrgent (from
//          ../../../ui/format), so the template can call them.
//   [html] After the chip, loop with @for over alarms (track by the alarm's event.alarmId). For
//          each alarm, a span with class "chip", plus the class "bad" when isUrgent(alarm) is
//          true, and the text "<alarmTitle(alarm)> · <the alarm's event.status>",
//          e.g. "HR high (143) · raised". Use the raw event.status; don't use alarmStatus()
//          from the same file, it builds a longer sentence.
//   [html] In ../../bed-detail.html, bind the card's alarms input to the page's alarms.
//   Check: the spec's "Exercise 2.2" tests; ICU-3 shows its alarm chips.
//
//  EXERCISE 2.3 · Pause, owned by the parent
//   Goal: the bed screen, not the card, owns "paused".
//   [ts]   Change paused from a signal into an input (type boolean, default false). The card
//          can no longer set it.
//   [ts]   Create an output `pausedChange` (type boolean).
//   [html] The button's click no longer sets paused: it emits the opposite of the current
//          paused through pausedChange (true after Pause, false after Resume).
//   [ts]   In ../../bed-detail.ts, create a signal `paused` (type boolean), initial value false.
//   [html] In ../../bed-detail.html, on the card: bind the paused input to that signal, and on
//          pausedChange set the signal to the emitted value.
//   Check: the spec's "Exercise 2.3" test; Pause still works in the browser.
//   Note: two tests go red now, because the card can't change paused by itself: the pause test
//   of 1.4 and the 2.4 test "flips its own button". That is expected: 2.4 turns them green
//   again. (The other 2.4 test, "accepts paused from the parent", already passes here.)
//
//  EXERCISE 2.4 · Pause, two-way
//   Goal: one member instead of an input plus an output.
//   [ts]   Replace the paused input AND the pausedChange output with a model `paused`
//          (type boolean, default false). A model is an input that the component can also set;
//          setting it emits pausedChange for the parent.
//   [html] The button's click sets paused to the opposite of its current value again.
//   [html] In ../../bed-detail.html, replace the two bindings from 2.3 with one two-way binding
//          of paused to the page's paused signal.
//   Check: the spec's "Exercise 2.4" tests, and 2.3 stays green: from outside, the API is the
//   same as before.
//
//  EXERCISE 2.5 · Full screen
//   Goal: the bedside display can show only the vitals.
//   [html] Add a template reference variable named `card` to the <section class="card vitals">.
//   [ts]   Create a required viewChild `card` (type ElementRef<HTMLElement>) that reads the
//          element with that reference name.
//   [ts]   Create a method fullscreen() that calls requestFullscreen() on that element
//          (its nativeElement).
//   [html] Add a second button with type "button" and the text "Full screen" next to Pause;
//          its click calls fullscreen().
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
