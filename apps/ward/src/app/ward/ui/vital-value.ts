import { Component, computed, input } from '@angular/core';

import { isOutOfRange, type StreamedVital } from '@core/messaging/contract';

@Component({
  selector: 'app-vital-value',
  template: `
    <span class="label">{{ label() }}</span>
    <span class="value" [class.out]="out()">{{ value() }}</span>
    @if (unit()) {
      <span class="unit">{{ unit() }}</span>
    }
  `,
  host: { '[class.stale]': 'stale()' },
  styles: `
    :host {
      display: grid;
      grid-template-columns: auto;
      justify-items: start;
    }
    .label {
      font-size: 0.75rem;
      color: var(--muted);
    }
    .value {
      font-size: 1.6rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }
    .out {
      color: var(--bad);
      animation: pulse 1s ease-in-out infinite;
    }
    .unit {
      font-size: 0.7rem;
      color: var(--muted);
    }
    :host(.stale) .value {
      color: var(--muted);
      animation: none;
      text-decoration: line-through dotted;
    }
  `,
})
export class VitalValue {
  readonly label = input.required<string>();
  readonly vital = input.required<StreamedVital>();
  readonly value = input.required<number>();
  readonly unit = input('');
  readonly stale = input(false);
  protected readonly out = computed(() =>
    isOutOfRange(this.vital(), this.value()),
  );
}
