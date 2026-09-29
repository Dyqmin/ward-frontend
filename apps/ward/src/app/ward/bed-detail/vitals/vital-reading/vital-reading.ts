import { Component, computed, input } from '@angular/core';

import { isOutOfRange, type StreamedVital } from '@core/messaging/contract';

// ============================================================================================
//  DAY 2 · EXERCISE 2.1 · VitalReading — one reading: "HR  72  bpm"
// ============================================================================================
//  The Vitals card shows three readings (HR, SpO₂, RR). Build the component for ONE of them;
//  the card uses it three times in EXERCISE 2.2 (../vitals-card/vitals-card.ts).
//  [ts] = this file, [html] = vital-reading.html. Styles are ready in vital-reading.scss.
//
//   [ts]   Create five signal inputs:
//            label   required input, type string          e.g. "HR"
//            vital   required input, type StreamedVital   "hr", "spo2" or "rr" (@core/messaging/contract)
//            value   required input, type number          e.g. 72
//            unit    input with default value ''          e.g. "bpm"
//            stale   input with default value false
//   [ts]   Create a computed `out` (type boolean): the result of isOutOfRange (from
//          @core/messaging/contract) called with the current vital and value. It is true when
//          the value is outside the thresholds of that vital.
//   [ts]   While stale is true, the component's own element (<app-vital-reading>) must have the
//          class "stale". Do it with the `host` property of @Component, an object:
//            - the key is a class binding for "stale", written exactly as you would write it on an
//              element in a template (square brackets, class-dot-name);
//            - the value is a string with the expression, the same as you would write in the
//              template: a call of the stale input.
//          Not in the template: the template can't reach the component's own element.
//   [html] Three spans:
//            class "label" with the label;
//            class "value" with the value, plus class "out" while out is true;
//            class "unit" with the unit, only when there is a unit.
//
//  Check: pnpm nx test ward --include='**/vital-reading.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-vital-reading',
  templateUrl: './vital-reading.html',
  styleUrl: './vital-reading.scss',
  host: { '[class.stale]': 'stale()' },
})
export class VitalReading {
  readonly label = input.required<string>();
  readonly vital = input.required<StreamedVital>();
  readonly value = input.required<number>();
  readonly unit = input('');
  readonly stale = input(false);

  protected readonly out = computed(() =>
    isOutOfRange(this.vital(), this.value()),
  );
}
