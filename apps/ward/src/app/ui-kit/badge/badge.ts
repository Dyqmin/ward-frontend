import { Component, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'ok' | 'warn' | 'bad';

/** A short status label in a pill: <app-badge tone="bad">3 need action</app-badge> */
@Component({
  selector: 'app-badge',
  template: '<ng-content />',
  styleUrl: './badge.scss',
  host: { '[attr.data-tone]': 'tone()' },
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
}
