import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AlarmActions } from './alarm-actions';

/** ❌ BAD (P1): the same alarm row, checked every time its parent is. */
@Component({
  selector: 'app-alarm-actions',
  templateUrl: './alarm-actions.html',
  styleUrl: './alarm-actions.scss',
  host: { 'data-cd': 'eager' }, // visible in the DOM; also keeps the component id unique
  // lint flags this — rightly. Disabled only for the ❌ demo:
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AlarmActionsEager extends AlarmActions {}
