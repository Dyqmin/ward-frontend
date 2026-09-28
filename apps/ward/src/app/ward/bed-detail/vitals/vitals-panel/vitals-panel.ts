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
//   [html] Move the WHOLE template of ../vitals-card/vitals-card.html into vitals-panel.html
//          (the <section #card>, chips, buttons, readings and <ng-content />).
//   [ts]   Create the panel's inputs, the same names the template already uses:
//            readonly frame  = input.required<VitalsFrame | undefined>();   the frame to show
//            readonly stale  = input(false);
//            readonly ageSec = input<number | null>(null);
//            readonly alarms = input<readonly AlarmView[]>([]);
//            readonly paused = model(false);
//   [html] In the moved template, replace shown() with frame().
//   [ts]   Move here from the card: the imports VitalReading and NgxSkeletonLoaderComponent,
//          alarmTitle / isUrgent, the viewChild `card` and fullscreen().
//   [card] The card's template becomes only:
//            <app-vitals-panel [frame]="shown()" [stale]="stale()" [ageSec]="ageSec()"
//                              [alarms]="alarms()" [(paused)]="paused">
//              <ng-content />
//            </app-vitals-panel>
//          and the card imports VitalsPanel. The card keeps bed, alarms, paused, vitals, ageSec,
//          stale, shown and the effect; ../../bed-detail.html does not change.
//   Check: pnpm nx test ward --include='**/vitals-panel.spec.ts'  (the panel is created with NO
//   providers: if it injects a service, it fails). vitals-card.spec.ts stays green, and the bed
//   screen works as before.
//
//  EXERCISE 3.2 · Check the split (no new code)
//   Go through the three components and fix what does not hold:
//   - VitalsPanel and VitalReading contain no inject(): values come in through inputs,
//     clicks go out through the model.
//   - VitalsCard has no markup of its own apart from <app-vitals-panel>.
//   - Data flows down, events flow up; no child reaches into its parent.
//   Be ready to answer: could VitalsPanel show a recorded session or a test fixture without any
//   change? Why? What would you change to show 18 of them on one screen?
//
//  EXERCISE 3.3 · Stretch: reusable liveness
//   [new file ../liveness.ts] Create a function:
//            export function liveness(lastAt: Signal<number | undefined>) { … }
//          Inside it: inject(Clock).now and inject(MessageBus), create the `ageSec` and `stale`
//          computeds (same logic as in the card, but from lastAt()), and return { ageSec, stale }.
//   [card] Replace your own ageSec and stale with:
//            private readonly live = liveness(computed(() => <arrival time of the latest frame>));
//            readonly ageSec = this.live.ageSec;
//            readonly stale  = this.live.stale;
//   Check: VitalsCard no longer injects Clock; all three specs stay green.
// ============================================================================================

@Component({
  selector: 'app-vitals-panel',
  templateUrl: './vitals-panel.html',
  styleUrl: './vitals-panel.scss',
})
export class VitalsPanel {}
