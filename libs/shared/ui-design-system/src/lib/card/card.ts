import { Component, input } from '@angular/core';

/**
 * A surface for one block of a page: border, background, padding and an optional heading.
 * Put a badge next to the heading with the `cardAside` attribute:
 *   <wm-card heading="Active alarms"><wm-badge cardAside tone="bad">2</app-badge>…</app-card>
 */
@Component({
  selector: 'wm-card',
  templateUrl: './card.html',
  styleUrl: './card.scss',
  host: { '[class.alert]': "tone() === 'alert'" },
})
export class Card {
  readonly heading = input<string>();
  /** 'alert' draws a red border: something on this card needs action. */
  readonly tone = input<'neutral' | 'alert'>('neutral');
}
