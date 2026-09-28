import { Component } from '@angular/core';

// ============================================================================================
//  DAY 2 · EXERCISE 2.1 · VitalReading — one reading: "HR  72  bpm"
// ============================================================================================
//  The Vitals card shows three readings (HR, SpO₂, RR). Build the component for ONE of them;
//  the card uses it three times in EXERCISE 2.2 (../vitals-card/vitals-card.ts).
//  [ts] = this file, [html] = vital-reading.html. Styles are ready in vital-reading.scss.
//
//   [ts]   Create five inputs:
//            label   text, required                       e.g. "HR"
//            vital   StreamedVital, required              hr, spo2 or rr (@core/messaging/contract)
//            value   number, required                     e.g. 72
//            unit    text, empty by default               e.g. "bpm"
//            stale   boolean, false by default
//   [ts]   Create a computed `out`: true when the value is outside the thresholds of its vital.
//          isOutOfRange() in @core/messaging/contract does the check.
//   [ts]   While stale is true, the component's own element (<app-vital-reading>) has the
//          class "stale". Set that up in the component's metadata, not in the template.
//   [html] Three spans:
//            class "label" with the label;
//            class "value" with the value, plus class "out" while out is true;
//            class "unit" with the unit, only when there is a unit.
//
//  Check: pnpm nx test ward --include='**/vital-reading.spec.ts'
// ============================================================================================

@Component({
  selector: 'app-vital-reading',
  templateUrl: './vital-reading.html',
  styleUrl: './vital-reading.scss',
})
export class VitalReading {}
