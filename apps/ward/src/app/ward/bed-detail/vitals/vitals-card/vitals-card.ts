import { Component, input } from '@angular/core';

import type { BedId } from '@core/messaging/contract';

// ============================================================================================
//  DAY 2 · THE VITALS CARD
// ============================================================================================
//  This card sits on the bed screen: open /ward, click a bed (e.g. ICU-3). Today you turn it
//  into a live monitor: HR, SpO₂ and RR every second, a live / stale chip, Pause and Full screen.
//
//  Do the steps in order. [ts] = this file, [html] = vitals-card.html (the same steps are
//  repeated there, at the place where the markup goes). Styles are ready in vitals-card.scss.
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
//   [ts]   Inject the bus:  private readonly bus = inject(MessageBus);   (@core/messaging/contract)
//   [ts]   Create a `vitals` resource with rxResource (@angular/core/rxjs-interop):
//            - params: the bed  →  () => this.bed()
//            - stream: this.bus.watch(`/topic/vitals.${bed}`), mapped to { frame, at: Date.now() }
//              (rxjs `map`), so every frame remembers when it ARRIVED.
//   [html] If vitals.hasValue(): show  HR … · SpO₂ … · RR …  from vitals.value().frame.
//          Otherwise: show <ngx-skeleton-loader count="3" />  (add NgxSkeletonLoaderComponent
//          from 'ngx-skeleton-loader' to the component's imports).
//   Check: the three numbers change every second.
//
//  EXERCISE 1.2 · How old is the data
//   [ts]   Inject the clock:  private readonly now = inject(Clock).now;   (@core/clock)
//          `now` is a signal with the current time; it ticks every second.
//   [ts]   Create an `ageSec` computed: whole seconds between now() and vitals.value().at,
//          or null while vitals has no value.
//   Check: put {{ ageSec() }} in the template for a moment; it stays at 0–1.
//
//  EXERCISE 1.3 · Stale or live
//   [ts]   Create a `stale` computed: true when !this.bus.connected()
//          OR ageSec() is bigger than STALE_AFTER_SEC (from ../../../ui/format); treat a null
//          ageSec as 0:  (this.ageSec() ?? 0) > STALE_AFTER_SEC
//   [html] In the heading, when there is data, show ONE chip:
//            stale() is true:  <span class="chip warn">no data for {{ ageSec() }} s</span>
//            otherwise:        <span class="chip ok">live</span>
//   Check: Simulate outage → `no data for N s`, counting up; `live` again after the outage.
//
//  EXERCISE 1.4a · The Pause button
//   [ts]   Create a `paused` signal:  readonly paused = signal(false);
//   [html] In the heading, after the chip, add ONE button:
//            text `Pause` when paused() is false, `Resume` when it is true.
//            On click: flip the signal  →  paused.set(!paused())
//   Check: the button switches between Pause and Resume. (The numbers don't stop yet.)
//
//  EXERCISE 1.4b · Freeze the numbers
//   [ts]   Create a `shown` linkedSignal: the frame whose numbers are on screen.
//            - source: the latest frame AND paused(), e.g.
//                () => ({ frame: <latest frame or undefined>, paused: this.paused() })
//            - computation({ frame, paused }, previous):
//                paused and there is a previous value → keep previous.value; otherwise → frame
//   [html] Show the numbers from shown() instead of vitals.value().frame.
//   [html] While paused() is true, show <span class="chip">paused</span> instead of the
//          live / stale chip.
//   Check: after Pause the numbers stop (the chart keeps moving); after Resume they jump on.
//
//  EXERCISE 1.5 · Warn when the data goes stale
//   [ts]   Inject the toasts:  private readonly toasts = inject(Toasts);   (@core/ui/toasts)
//   [ts]   In the constructor, create an effect that runs when stale() changes:
//            - if stale() is false: do nothing
//            - if stale() is true:  this.toasts.show(`${this.bed()}: no live vitals`, 'warn')
//          Wrap the toasts.show(…) call in untracked(() => …), so that reading bed() inside it
//          does NOT make the effect run again.
//   Check: one outage → exactly one toast.
//
// --------------------------------------------------------------------------------------------
//  PART 2 · COMPONENT API
// --------------------------------------------------------------------------------------------
//
//  EXERCISE 2.1 is in ../vital-reading/vital-reading.ts. Do it first, then come back here.
//
//  EXERCISE 2.2 · Readings and alarms
//   [ts]   Add VitalReading (../vital-reading/vital-reading) to the component's imports.
//   [html] Replace the  HR … · SpO₂ … · RR …  text with three readings in <div class="now">:
//            <app-vital-reading label="HR"   vital="hr"   [value]="…" unit="bpm"  [stale]="stale()" />
//            <app-vital-reading label="SpO₂" vital="spo2" [value]="…" unit="%"    [stale]="stale()" />
//            <app-vital-reading label="RR"   vital="rr"   [value]="…" unit="/min" [stale]="stale()" />
//   [ts]   Create an `alarms` input:  readonly alarms = input<readonly AlarmView[]>([]);
//          (AlarmView from ../../../data/alarms-store)
//   [ts]   Expose the helpers to the template:
//            protected readonly alarmTitle = alarmTitle;   protected readonly isUrgent = isUrgent;
//          (both from ../../../ui/format)
//   [html] After the chip, loop over alarms() (track a.event.alarmId) and show for each:
//            <span class="chip" [class.bad]="isUrgent(a)">{{ alarmTitle(a) }} · {{ a.event.status }}</span>
//   [html] In ../../bed-detail.html pass the alarms:  <app-vitals-card … [alarms]="alarms()">
//   Check: the spec's "Exercise 2.2" tests; ICU-3 shows its alarm chips.
//
//  EXERCISE 2.3 · Pause, owned by the parent
//   [ts]   Change `paused` from a signal into an input:  readonly paused = input(false);
//          The card can no longer change it itself.
//   [ts]   Create an output:  readonly pausedChange = output<boolean>();
//   [html] The button's click now emits the new value:  pausedChange.emit(!paused())
//   [ts]   In ../../bed-detail.ts create the state:  protected readonly paused = signal(false);
//   [html] In ../../bed-detail.html:  [paused]="paused()" (pausedChange)="paused.set($event)"
//   Check: the spec's "Exercise 2.3" test; Pause still works in the browser.
//   Note: the "Exercise 1.4" test goes red now, because the card can no longer change `paused`
//   by itself. That is expected: 2.4 turns it green again.
//
//  EXERCISE 2.4 · Pause, two-way
//   [ts]   Replace the `paused` input AND the `pausedChange` output with one model:
//            readonly paused = model(false);
//   [html] The button's click sets it directly again:  paused.set(!paused())
//   [html] In ../../bed-detail.html replace the two bindings with one:  [(paused)]="paused"
//   Check: the spec's "Exercise 2.4" tests, and 2.3 stays green: from outside, the API is the same.
//
//  EXERCISE 2.5 · Full screen
//   [html] Give the section a template reference:  <section #card class="card vitals">
//   [ts]   Get it with viewChild:
//            private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
//   [ts]   Create a method fullscreen() that calls  this.card().nativeElement.requestFullscreen()
//   [html] Add a button next to Pause:  <button type="button" (click)="fullscreen()">Full screen</button>
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

  // EXERCISE 1.1: bus, vitals
  // EXERCISE 1.2: now, ageSec
  // EXERCISE 1.3: stale
  // EXERCISE 1.4: paused, shown
  // EXERCISE 1.5: toasts, and the effect in a constructor
}
