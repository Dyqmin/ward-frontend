import { Component } from '@angular/core';

// DAY 2 · LIVE CODING — one vital (label, value, unit), used three times by the bed tile.
// Styles are ready in vital-value.scss (.label, .value, .out, .unit, :host(.stale)).

// STEP 2.1 · imports
// import { computed, input } from '@angular/core';
// import { isOutOfRange, type StreamedVital } from '@core/messaging/contract';

@Component({
  selector: 'app-vital-value',
  templateUrl: './vital-value.html',
  styleUrl: './vital-value.scss',
  // STEP 2.1: a class on the component's own element, driven by an input
  // host: { '[class.stale]': 'stale()' },
})
export class VitalValue {
  // STEP 2.1 · Signal inputs
  // Show: required vs default inputs; an input IS a signal, so `out` is a plain computed and
  // re-evaluates when `vital` or `value` changes. No ngOnChanges, no setters.
  // `vital` is StreamedVital, so vital="temp" in a template does not compile (Day 1, Exercise 3).
  // Then in vital-value.html: STEP 2.1.
  //
  // readonly label = input.required<string>();
  // readonly vital = input.required<StreamedVital>();
  // readonly value = input.required<number>();
  // readonly unit = input('');
  // readonly stale = input(false);
  //
  // protected readonly out = computed(() =>
  //   isOutOfRange(this.vital(), this.value()),
  // );
}
