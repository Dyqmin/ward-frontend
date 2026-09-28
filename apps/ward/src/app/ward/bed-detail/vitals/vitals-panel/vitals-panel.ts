import { Component } from '@angular/core';

// ============================================================================================
//  DAY 2 · PART 3 · COMPONENT ARCHITECTURE — VitalsPanel
// ============================================================================================
//  After Part 2, VitalsCard does two jobs: it GETS the data (bus, clock, stale, toast) and it
//  SHOWS it (readings, chips, buttons). Split the jobs into two components:
//    VitalsCard   smart:          gets the data, owns the state, decides
//    VitalsPanel  presentational: shows what it is given, reports clicks  ← this file
//  [ts] = this file, [html] = vitals-panel.html, [card] = ../vitals-card/vitals-card.ts / .html
//
//  EXERCISE 3.1 · Extract the panel
//   [html] Move the whole template of the card into vitals-panel.html: the section, the chips,
//          the buttons, the readings and the content slot for the chart.
//   [ts]   Give the panel everything the moved template reads, as inputs:
//            frame    the frame to show (VitalsFrame or undefined), required
//            stale    boolean, false by default
//            ageSec   number or null, null by default
//            alarms   list of AlarmView, empty by default
//            paused   two-way, like the card's
//          In the template, the numbers now come from frame instead of shown.
//   [ts]   Move into the panel what only the display needs: the imports of VitalReading and the
//          skeleton loader, the alarm helpers, and Full screen.
//   [card] The card's template now only renders the panel, passes it shown, stale, ageSec,
//          alarms and paused (two-way), and forwards its own projected content (the chart)
//          into it.
//          The card keeps bed, alarms, paused, the resource, ageSec, stale, shown and the toast.
//          Its API does not change, so ../../bed-detail.html does not change either.
//   Check: pnpm nx test ward --include='**/vitals-panel.spec.ts' (the panel is created with no
//   providers: if it injects a service, it fails). vitals-card.spec.ts stays green, and the bed
//   screen works as before.
//
//  EXERCISE 3.2 · Check the split (no new code)
//   Go through the three components and fix what does not hold:
//   - VitalsPanel and VitalReading inject nothing: values come in through inputs, clicks go out
//     through paused.
//   - VitalsCard has no markup of its own apart from the panel.
//   - Data flows down, events flow up; no child reaches into its parent.
//   Be ready to answer: could VitalsPanel show a recorded session or a test fixture without any
//   change? Why? What would you change to show 18 of them on one screen?
//
//  EXERCISE 3.3 · Stretch: reusable liveness
//   "How old is the newest frame, and is it stale" is not specific to this card.
//   [new file ../liveness.ts] Create a function `liveness`. It takes a signal with the arrival
//          time of the newest frame (milliseconds, or undefined) and returns ageSec and stale as
//          signals, with the same rules as in the card. It gets Clock and MessageBus itself, so
//          it can only be called while the card is being created (e.g. in a field).
//   [card] Use it instead of your own ageSec and stale.
//   Check: the card no longer injects Clock; all three specs stay green.
// ============================================================================================

@Component({
  selector: 'app-vitals-panel',
  templateUrl: './vitals-panel.html',
  styleUrl: './vitals-panel.scss',
})
export class VitalsPanel {}
