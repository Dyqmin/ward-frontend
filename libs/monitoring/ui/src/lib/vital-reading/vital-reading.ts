import { Component, computed, input } from '@angular/core';

import { isOutOfRange, type StreamedVital } from '@wm/shared/domain';

@Component({
  selector: 'wm-vital-reading',
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
