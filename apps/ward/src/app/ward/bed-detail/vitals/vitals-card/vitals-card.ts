import { Component, input } from '@angular/core';

import type { BedId } from '@core/messaging/contract';

// ============================================================================================
//  DAY 2 · THE VITALS CARD
// ============================================================================================
//  This card sits on the bed screen: open /ward, click a bed (e.g. ICU-3). Today you turn it
//  into a live monitor: HR, SpO₂ and RR every second, a live / stale chip, Pause and Full screen.
//
//  Work through the exercises in order. Each one says WHERE to write (this file = .ts, the
//  template = vitals-card.html) and how to check it. Styles are ready in vitals-card.scss.
//
//  Check with the spec (keep it running while you work):
//    pnpm nx test ward --include='**/vitals-card.spec.ts'
//  and in the browser: log in with ?mock, open ICU-3, use Dev → Simulate outage (8 s).
// ============================================================================================

// --------------------------------------------------------------------------------------------
//  PART 1 · SIGNALS
// --------------------------------------------------------------------------------------------
//
//  EXERCISE 1.1 · Live data                                                   (.ts and .html)
//   - Add `vitals`: the live vitals of `bed`, from MessageBus (@core/messaging/contract):
//     `bus.watch(`/topic/vitals.${bed}`)` sends one VitalsFrame per second.
//   - Keep each frame together with the moment it ARRIVED: `{ frame, at: Date.now() }`.
//   - When `bed` changes, the card must switch to the new bed's stream by itself.
//   - In the template (EXERCISE 1.1), once there is data, show
//     `HR … · SpO₂ … · RR …` from the latest frame. Until then, show `<ngx-skeleton-loader count="3" />`.
//   Check: the three numbers change every second.
//
//  EXERCISE 1.2 · How old is the data                                                  (.ts)
//   - Add `ageSec`: whole seconds since the latest frame ARRIVED (`at`), or `null` with no data.
//   - "Now" is `inject(Clock).now` (@core/clock), a signal that ticks every second.
//     Don't start your own timer.
//   Check: show {{ ageSec() }} for a moment; it stays at 0–1 while data flows.
//
//  EXERCISE 1.3 · Stale or live                                              (.ts and .html)
//   - Add `stale`: true when the bus is not connected (`bus.connected()`) OR the data is older
//     than STALE_AFTER_SEC (from ../../../ui/format).
//   - In the template (EXERCISE 1.3), once there is data, show ONE chip:
//       stale:     <span class="chip warn">no data for {{ ageSec() }} s</span>
//       otherwise: <span class="chip ok">live</span>
//   Check: Simulate outage → `no data for N s`, counting up; back to `live` after the outage.
//
//  EXERCISE 1.4 · Pause                                                      (.ts and .html)
//   A nurse wants to freeze the numbers to read them out.
//   - Add `paused` (starts false) and a button in the heading (EXERCISE 1.4):
//     `Pause` while running, `Resume` while paused. A click flips `paused`.
//   - Add `shown`: the frame whose numbers are displayed. Running: the latest frame. Paused: the
//     frame that was on screen when Pause was clicked. Derive it from the latest frame and
//     `paused` together; the click handler only flips `paused`.
//   - Show the numbers from `shown`. While paused, show <span class="chip">paused</span>
//     instead of the live / stale chip.
//   Check: after Pause the numbers stop (the chart keeps moving); after Resume they jump on.
//
//  EXERCISE 1.5 · Warn when the data goes stale                                        (.ts)
//   - Every time `stale` becomes true, show a toast:
//       inject(Toasts).show(`${bed}: no live vitals`, 'warn')     (Toasts from @core/ui/toasts)
//   - Only `stale` decides when this runs. Reading `bed()` for the text must not make it run.
//   Check: one outage → exactly one toast.
//
// --------------------------------------------------------------------------------------------
//  PART 2 · COMPONENT API
// --------------------------------------------------------------------------------------------
//
//  EXERCISE 2.1 is in ../vital-reading/vital-reading.ts. Do it first, then come back here.
//
//  EXERCISE 2.2 · Readings and alarms                                        (.ts and .html)
//   - In the template, replace the `HR … · SpO₂ … · RR …` text with three <app-vital-reading>:
//       HR, vital "hr", unit "bpm" · SpO₂, vital "spo2", unit "%" · RR, vital "rr", unit "/min"
//     and pass `stale` to each of them.
//   - Add an input `alarms` (readonly AlarmView[] from ../../../data/alarms-store, default []).
//     The bed screen passes them: in ../../bed-detail.html add [alarms]="alarms()".
//   - In the template (EXERCISE 2.2), after the chip, one chip per alarm:
//       <span class="chip" [class.bad]="isUrgent(a)">{{ alarmTitle(a) }} · {{ a.event.status }}</span>
//     (alarmTitle and isUrgent from ../../../ui/format)
//   Check: the spec's "Exercise 2.2" tests; in the browser, ICU-3 shows its alarm chips.
//
//  EXERCISE 2.3 · Pause, owned by the parent                                 (.ts and .html)
//   The bed screen wants to own "paused" (later it could pause other panels too).
//   - Turn `paused` into an INPUT (default false). The card can no longer change it itself.
//   - Add an OUTPUT named `pausedChange`: the button emits the new value (true after Pause).
//   - In ../../bed-detail.ts add `paused = signal(false)`; in ../../bed-detail.html pass it in
//     and update it from `pausedChange`.
//   Check: the spec's "Exercise 2.3" test; Pause still works in the browser.
//   Note: the "Exercise 1.4" test goes red now, because the card can no longer change `paused`
//   by itself. That is expected: 2.4 turns it green again.
//
//  EXERCISE 2.4 · Pause, two-way                                             (.ts and .html)
//   - Replace the `paused` input + `pausedChange` output with ONE member `paused` that the
//     parent can bind AND the card can write itself.
//   - In ../../bed-detail.html bind it both ways with one binding.
//   Check: the spec's "Exercise 2.4" tests, and 2.3 stays green: from outside, same API.
//
//  EXERCISE 2.5 · Full screen                                                (.ts and .html)
//   - Add a `Full screen` button next to Pause.
//   - A click calls requestFullscreen() on this card's <section class="card vitals">.
//     Get that element in the class, without document.querySelector.
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

  // EXERCISE 1.1: vitals
  // EXERCISE 1.2: ageSec
  // EXERCISE 1.3: stale
  // EXERCISE 1.4: paused, shown
  // EXERCISE 1.5: the stale toast
}
