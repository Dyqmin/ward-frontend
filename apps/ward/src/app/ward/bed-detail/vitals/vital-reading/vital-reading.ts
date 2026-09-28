import { Component } from '@angular/core';

// ============================================================================================
//  DAY 2 · EXERCISE 2.1 · VitalReading — one reading: "HR  72  bpm"
// ============================================================================================
//  The Vitals card shows three readings (HR, SpO₂, RR). Build the component for ONE of them,
//  so the card can use it three times (EXERCISE 2.2 in ../vitals-card/vitals-card.ts).
//
//  In this file (.ts):
//   - Inputs:
//       label  string, required          e.g. "HR"
//       vital  StreamedVital, required   'hr' | 'spo2' | 'rr'  (from @core/messaging/contract)
//       value  number, required          e.g. 72
//       unit   string, default ''        e.g. "bpm"
//       stale  boolean, default false
//   - `out`: true when the value is outside the thresholds.
//     Use isOutOfRange(vital, value) from @core/messaging/contract.
//   - When `stale` is true, THIS component's own element gets the class `stale`
//     (the styles grey the value out).
//
//  In vital-reading.html:
//     <span class="label">…</span>
//     <span class="value">…</span>      with the class `out` when `out` is true
//     <span class="unit">…</span>       only when there is a unit
//
//  Styles are ready in vital-reading.scss.
//  Check: pnpm nx test ward --include='**/vital-reading.spec.ts'
// ============================================================================================

@Component({
  selector: 'app-vital-reading',
  templateUrl: './vital-reading.html',
  styleUrl: './vital-reading.scss',
})
export class VitalReading {}
