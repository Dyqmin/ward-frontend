import { Component } from '@angular/core';

// ============================================================================================
//  DAY 2 · EXERCISE 2.1 · VitalReading — one reading: "HR  72  bpm"
// ============================================================================================
//  The Vitals card shows three readings (HR, SpO₂, RR). Build the component for ONE of them;
//  the card uses it three times in EXERCISE 2.2 (../vitals-card/vitals-card.ts).
//  [ts] = this file, [html] = vital-reading.html. Styles are ready in vital-reading.scss.
//
//   [ts]   Create five signal inputs:
//            readonly label = input.required<string>();          e.g. "HR"
//            readonly vital = input.required<StreamedVital>();   'hr' | 'spo2' | 'rr'
//            readonly value = input.required<number>();          e.g. 72
//            readonly unit  = input('');                         e.g. "bpm"
//            readonly stale = input(false);
//          (StreamedVital from @core/messaging/contract)
//   [ts]   Create an `out` computed: isOutOfRange(this.vital(), this.value())
//          (isOutOfRange from @core/messaging/contract)
//   [ts]   Put the class `stale` on the component's own element: in @Component add
//            host: { '[class.stale]': 'stale()' }
//   [html] Three spans:
//            <span class="label">{{ label() }}</span>
//            <span class="value" [class.out]="out()">{{ value() }}</span>
//            <span class="unit">{{ unit() }}</span>        only if unit() is not empty
//
//  Check: pnpm nx test ward --include='**/vital-reading.spec.ts'
// ============================================================================================

@Component({
  selector: 'app-vital-reading',
  templateUrl: './vital-reading.html',
  styleUrl: './vital-reading.scss',
})
export class VitalReading {}
