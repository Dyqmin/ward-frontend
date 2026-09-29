import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import {
  MessageBus,
  type BedId,
  type VitalsFrame,
} from '@core/messaging/contract';
import { Toasts } from '@core/ui/toasts';
import type { AlarmView } from '../../../data/alarms-store';
import { liveness } from '../liveness';
import { VitalsPanel } from '../vitals-panel/vitals-panel';

// ============================================================================================
//  DAY 2 · THE VITALS CARD
// ============================================================================================
//  This card sits on the bed screen: open /ward, click a bed (e.g. ICU-3). Today you turn it
//  into a live monitor: HR, SpO₂ and RR every second, a live / stale chip, Pause and Full screen.
//
//  Do the steps in order. [ts] = this file, [html] = vitals-card.html (the template steps are
//  repeated there, where the markup goes). Styles are ready in vitals-card.scss.
//
//  Check with the spec after every step (it runs once; run it again after each change):
//    pnpm nx test ward --include='**/vitals-card.spec.ts' --reporters=verbose
//  Every test is named after its exercise; ✓ = passing, × = failing. If the template doesn't
//  compile, ALL tests of the file fail: read the first error at the top.
//  and in the browser: log in with ?mock, open ICU-3, use Dev → Simulate outage (8 s).
// ============================================================================================

// --------------------------------------------------------------------------------------------
//  PART 1 · SIGNALS
// --------------------------------------------------------------------------------------------
//
//  EXERCISE 1.1 · Live data
//   Goal: the card shows the live HR, SpO₂ and RR of its bed.
//   [ts]   Inject MessageBus (from @core/messaging/contract) with the inject() function into a
//          private field `bus`.
//   [ts]   Create a protected field `vitals` with rxResource (from @angular/core/rxjs-interop).
//          rxResource takes an options object with two functions:
//            - params: a function that returns the current value of the `bed` input. Because it
//              reads the bed signal, the resource restarts by itself when the bed changes;
//            - stream: a function that receives an object; its `params` field holds that bed.
//              Return the bus's watch() of the topic "/topic/vitals.<bed>" (build it with a
//              template string, so watch() knows the payload type). It emits one VitalsFrame per
//              second. Pipe it through rxjs map into an object with two fields: `frame` (the
//              frame itself) and `at` (Date.now(): the moment it arrived).
//   [html] Use an @if / @else block (as in ../../bed-detail.html) with the resource's hasValue()
//          method. Inside the @if, vitals.value() is always defined:
//            - @if: a paragraph with the hr, spo2 and rr of vitals.value().frame,
//              e.g. "HR 72 · SpO₂ 97 · RR 14";
//            - @else: an <ngx-skeleton-loader> with its count input set to 3. Add
//              NgxSkeletonLoaderComponent (from 'ngx-skeleton-loader') to the component's imports.
//   Check: the three numbers change every second.
//
//  EXERCISE 1.2 · How old is the data
//   Goal: the card knows how many seconds ago the last frame arrived.
//   [ts]   Inject Clock (from @core/clock) and keep its `now` signal in a private field `now`.
//          `now` holds the current time in milliseconds and updates every second. Don't start
//          your own timer.
//   [ts]   Create a protected computed `ageSec` (type number | null):
//            - vitals has no value → null;
//            - otherwise → now minus the value's `at`, divided by 1000, rounded to whole
//              seconds, and never below 0. (The clock ticks once a second, so right after a
//              frame arrives, now can be slightly EARLIER than `at`.)
//   Check: show ageSec in the template for a moment; it stays at 0–1 and is never negative.
//   (No spec test for 1.2: 1.3 builds on it.)
//
//  EXERCISE 1.3 · Stale or live
//   Goal: the card says clearly when its numbers are old.
//   [ts]   Create a protected computed `stale` (type boolean). It is true when:
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
//   [ts]   Create a protected signal `paused` (type boolean), initial value false.
//   [html] In the heading, after the chip, one button with type "button":
//            - its text is "Pause" while paused is false, "Resume" while paused is true;
//            - a click sets paused to the opposite of its current value.
//   Check: in the browser only: the button switches between Pause and Resume, the numbers
//   don't stop yet. The spec test for pause turns green after 1.4b.
//
//  EXERCISE 1.4b · Freeze the numbers
//   Goal: while paused, the three numbers stay the same; the chart keeps moving.
//   [ts]   Create a protected linkedSignal `shown`: the frame whose HR, SpO₂ and RR the card
//          displays. linkedSignal takes an options object with two functions:
//            - source: a function that returns an object with two fields, `frame` (the frame of
//              vitals' value, or undefined while vitals has no value) and `paused` (the current
//              value of paused);
//            - computation: a function with two arguments. The first is that source object.
//              The second, `previous`, is undefined on the first run; after that it is an object
//              whose `value` field is what shown returned last time.
//              Rule: if the source's paused is true AND previous?.value is defined, return
//              previous.value (the frozen frame). In every other case return the source's frame.
//          Types: give linkedSignal both type arguments, first the type of the source object,
//          then VitalsFrame | undefined.
//          Why not a computed: a computed can't see its own previous value, so it can't keep a
//          frame while paused. The button from 1.4a stays as it is: it only flips paused.
//   [html] shown() can be undefined, so change the @if around the numbers: instead of
//          vitals.hasValue(), use @if on shown() with an `as` alias named `f`. Inside it take
//          the three numbers from f. The skeleton stays in the @else.
//   [html] While paused is true, show a span with class "chip" and the text "paused" instead of
//          the live / stale chip (like that chip: only once vitals has a value).
//   Check: after Pause the numbers stop (the chart keeps moving); after Resume they jump on.
//
//  EXERCISE 1.5 · Stretch: warn when the data goes stale
//   Optional, if you have time: you practised effect in the warm-up, and nothing in Part 2
//   depends on this step. Its spec test stays red if you skip it.
//   Goal: a nurse who looks away still hears about lost data.
//   [ts]   Inject Toasts (from @core/ui/toasts) into a private field `toasts`.
//   [ts]   Add a constructor and create an effect in it (effect and untracked are in
//          @angular/core). The effect's function:
//            - reads stale(); if it is false, returns;
//            - if it is true, calls untracked with a function; inside THAT function it reads
//              bed() and calls toasts.show with the text "<bed>: no live vitals"
//              (e.g. "ICU-3: no live vitals") and the kind 'warn'.
//          Why untracked: everything the effect reads becomes a dependency. Reading bed() inside
//          untracked keeps it out, so only a change of stale can run the effect again.
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
//   [html] Inside the @if on shown() (alias f), replace the paragraph with a div with class
//          "now" holding three app-vital-reading elements. Set their inputs:
//            HR:   label "HR",   vital "hr",   unit "bpm",  value: f's hr
//            SpO₂: label "SpO₂", vital "spo2", unit "%",    value: f's spo2
//            RR:   label "RR",   vital "rr",   unit "/min", value: f's rr
//          and give all three the card's stale. Use f, not shown()?.hr: value is a required
//          number, and number | undefined doesn't compile.
//   [ts]   Create an input `alarms` (type readonly AlarmView[], from
//          ../../../data/alarms-store), default an empty array.
//   [ts]   Add two protected fields named alarmTitle and isUrgent that point to the functions
//          of the same names (from ../../../ui/format), so the template can call them.
//   [html] In the heading, after the chip's block (not inside it: alarms don't depend on
//          vitals), loop with @for over alarms() (track by the alarm's event.alarmId). For
//          each alarm, a span with class "chip", plus the class "bad" when isUrgent(alarm) is
//          true, and the text "<alarmTitle(alarm)> · <the alarm's event.status>",
//          e.g. "HR high (143) · raised". Use the raw event.status; don't use alarmStatus()
//          from the same file, it builds a longer sentence.
//   [html] In ../../bed-detail.html, bind the card's alarms input to the page's alarms.
//   Check: the spec's "Exercise 2.2" tests. In the browser, ICU-3 shows alarm chips once the
//   mock ward raises an alarm there, which can take a little while.
//
//  EXERCISE 2.3 · Pause, owned by the parent
//   Goal: the bed screen, not the card, owns "paused".
//   [ts]   Change paused from a signal into an input (type boolean, default false). The card
//          can no longer set it.
//   [ts]   Create an output `pausedChange` (type boolean).
//   [html] The button's click no longer sets paused: it emits the opposite of the current
//          paused through pausedChange (true after Pause, false after Resume).
//   [ts]   In ../../bed-detail.ts, create a protected signal `paused` (type boolean), initial
//          value false (import signal from @angular/core).
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
//          of paused ("banana in a box") to the page's paused signal. Bind the signal ITSELF,
//          without call parentheses: two-way binding needs something it can write to, and
//          paused() is only a value.
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

/** The smart half (3.1): gets the data, owns the state, decides. VitalsPanel shows it. */
@Component({
  selector: 'app-vitals-card',
  imports: [VitalsPanel],
  templateUrl: './vitals-card.html',
  styleUrl: './vitals-card.scss',
})
export class VitalsCard {
  /** Which bed to show; the bed screen passes it. */
  readonly bed = input.required<BedId>();
  // 2.2
  readonly alarms = input<readonly AlarmView[]>([]);
  // 1.4a → 2.3 (input + output) → 2.4 (model)
  readonly paused = model(false);

  private readonly bus = inject(MessageBus);
  private readonly toasts = inject(Toasts);

  // 1.1
  protected readonly vitals = rxResource({
    params: () => this.bed(),
    stream: ({ params: bed }) =>
      this.bus
        .watch(`/topic/vitals.${bed}`)
        .pipe(map((frame) => ({ frame, at: Date.now() }))),
  });

  // 1.2 + 1.3, extracted into liveness() in 3.3
  private readonly live = liveness(
    computed(() =>
      this.vitals.hasValue() ? this.vitals.value().at : undefined,
    ),
  );
  protected readonly ageSec = this.live.ageSec;
  protected readonly stale = this.live.stale;

  // 1.4b
  protected readonly shown = linkedSignal<
    { frame: VitalsFrame | undefined; paused: boolean },
    VitalsFrame | undefined
  >({
    source: () => ({
      frame: this.vitals.hasValue() ? this.vitals.value().frame : undefined,
      paused: this.paused(),
    }),
    computation: (source, previous) =>
      source.paused && previous?.value ? previous.value : source.frame,
  });

  constructor() {
    // 1.5
    effect(() => {
      if (!this.stale()) return;
      untracked(() =>
        this.toasts.show(`${this.bed()}: no live vitals`, 'warn'),
      );
    });
  }
}
