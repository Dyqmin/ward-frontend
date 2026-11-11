import { ChangeDetectionStrategy, Component } from '@angular/core';

import { VitalValue } from './vital-value';

/** ❌ BAD (P1): the same value, checked every time its parent is. */
@Component({
  selector: 'app-vital-value',
  templateUrl: './vital-value.html',
  host: { '[class.stale]': 'stale()', 'data-cd': 'eager' },
  styleUrl: './vital-value.scss',
  // lint flags this — rightly. Disabled only for the ❌ demo:
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class VitalValueEager extends VitalValue {}
