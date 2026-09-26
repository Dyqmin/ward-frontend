import { Component, computed, input } from '@angular/core';

import { isOutOfRange, type StreamedVital } from '@core/messaging/contract';

@Component({
  selector: 'app-vital-value',
  templateUrl: './vital-value.html',
  host: { '[class.stale]': 'stale()' },
  styleUrl: './vital-value.scss',
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
