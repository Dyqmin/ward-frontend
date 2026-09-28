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
//   [html] Move the whole template of the card into vitals-panel.html: the section with its
//          #card reference, the chips, the buttons, the readings and the <ng-content /> for the
//          chart. You can delete the EXERCISE comments.
//   [ts]   Give the panel everything the moved template reads, as signal inputs:
//            frame    required input, type VitalsFrame | undefined   the frame to show
//            stale    input, default false
//            ageSec   input, type number | null, default null
//            alarms   input, type readonly AlarmView[], default an empty array
//            paused   a model, default false (like the card's)
//          In the template, every place that read the resource or shown now reads frame():
//          the chip's "once there is data" condition becomes frame(), and the numbers' @if on
//          shown() becomes an @if on frame() (keep the alias f).
//   [ts]   Move into the panel what only the display needs: the imports of VitalReading and the
//          skeleton loader, the alarm helpers, and Full screen.
//          Styles: vitals-panel.scss already has the card's styles; leave vitals-card.scss as is.
//   [card] The card's template now only renders one app-vitals-panel:
//            - bind the panel's frame to the card's shown, and stale, ageSec and alarms to the
//              card's members of the same names;
//            - bind paused two-way to the card's paused model (the model itself, without call
//              parentheses, as in 2.4);
//            - between the panel's opening and closing tags put an ng-content, so the chart
//              the bed screen gives the card goes on into the panel.
//          Add VitalsPanel to the card's imports.
//          The card keeps bed, alarms, paused, the resource, ageSec, stale, shown and the toast.
//          Its API does not change, so ../../bed-detail.html does not change either.
//   Check: pnpm nx test ward --include='**/vitals-panel.spec.ts' --reporters=verbose (created with no
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
//   [new file apps/ward/src/app/ward/bed-detail/vitals/liveness.ts] Export a function
//          `liveness` with one parameter `lastAt`, type Signal<number | undefined>: the arrival
//          time of the newest frame in milliseconds, or undefined with no frame.
//            - inside it, get Clock and MessageBus with inject(). inject() works in a plain
//              function as long as it runs while a component is being created (an "injection
//              context"), e.g. when the card calls it in a field initializer;
//            - create two computeds with the same rules as in the card: ageSec (never below 0,
//              null without lastAt) and stale (STALE_AFTER_SEC comes from ../../ui/format);
//            - return an object with two fields: ageSec (Signal<number | null>) and stale
//              (Signal<boolean>).
//   [card] Replace your own ageSec and stale:
//            - create a computed with the arrival time of the latest frame (the `at` of vitals'
//              value, or undefined), and pass it to liveness in a private field `live`;
//            - make ageSec and stale point to the two signals liveness returned;
//            - put these fields AFTER the vitals field: they read it while the card is created.
//          Remove the card's own Clock injection.
//   Check: the card no longer injects Clock; all three specs stay green. (No spec test for 3.3.)
// ============================================================================================

@Component({
  selector: 'app-vitals-panel',
  templateUrl: './vitals-panel.html',
  styleUrl: './vitals-panel.scss',
})
export class VitalsPanel {}
