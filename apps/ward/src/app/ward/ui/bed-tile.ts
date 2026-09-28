import { Component, input } from '@angular/core';

import type { BedId } from '@core/messaging/contract';

/**
 * DAY 2 · LIVE CODING — the bed tile on the nurse station, built on stage.
 * Styles are ready in bed-tile.scss (.tile, header, .name, .vitals, footer, .alarm, .stale, .empty).
 */
@Component({
  selector: 'app-bed-tile',
  templateUrl: './bed-tile.html',
  styleUrl: './bed-tile.scss',
})
export class BedTile {
  readonly bed = input.required<BedId>();
}
