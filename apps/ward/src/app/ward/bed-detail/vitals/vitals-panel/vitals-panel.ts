import { Component } from '@angular/core';

// ============================================================================================
//  DAY 2 · PART 3 · COMPONENT ARCHITECTURE — VitalsPanel
// ============================================================================================
//  After Part 2, VitalsCard does two jobs: it GETS the data (bus, clock, stale, toast) and it
//  SHOWS it (readings, chips, buttons). Split the jobs:
//    VitalsCard   smart:          gets the data, owns the state, decides — like before, from outside
//    VitalsPanel  presentational: shows what it is given, reports clicks — this file
//
//  EXERCISE 3.1 · Extract the panel                          (this file, .html, and the card)
//   - Move the whole template of ../vitals-card/vitals-card.html into vitals-panel.html.
//   - Panel inputs: `frame` (VitalsFrame | undefined, required), `stale`, `ageSec`, `alarms`,
//     and `paused` two-way (like the card's). Full screen moves here too: the <section> is here.
//   - The card's template becomes only:
//       <app-vitals-panel [frame]="shown()" [stale]="stale()" [ageSec]="ageSec()"
//                         [alarms]="alarms()" [(paused)]="paused">
//         <ng-content />
//       </app-vitals-panel>
//   - The card keeps its API (bed, alarms, paused): ../../bed-detail.html does not change.
//   Check: pnpm nx test ward --include='**/vitals-panel.spec.ts'  (the panel is created with NO
//   providers: if it injects a service, it fails), vitals-card.spec.ts stays green, and the bed
//   screen works as before.
//
//  EXERCISE 3.2 · Check the split                                          (no new code)
//   - VitalsPanel and VitalReading inject nothing and know nothing about the bus or the clock:
//     values come in through inputs, clicks go out through outputs / the model.
//   - VitalsCard has (almost) no markup of its own.
//   - Data flows down, events flow up; no child reaches into its parent.
//   Be ready to answer: could VitalsPanel show a recorded session or a test fixture without any
//   change? Why? What would you change to show 18 of them on one screen?
//
//  EXERCISE 3.3 · Stretch: reusable liveness                     (new file ../liveness.ts)
//   "How old is the newest frame, and is it stale" is not specific to this card.
//   - Create ../liveness.ts with a function liveness(lastAt): it takes a signal with the time
//     the newest frame arrived (ms, or undefined) and returns { ageSec, stale } as signals.
//     It gets Clock and MessageBus itself.
//   - Use it in VitalsCard instead of your own ageSec and stale.
//   Check: VitalsCard no longer mentions Clock; all three specs stay green.
// ============================================================================================

@Component({
  selector: 'app-vitals-panel',
  templateUrl: './vitals-panel.html',
  styleUrl: './vitals-panel.scss',
})
export class VitalsPanel {}
