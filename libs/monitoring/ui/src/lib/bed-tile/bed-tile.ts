import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type BedId, toSlug } from '@wm/shared/domain';

/**
 * The bed tile of the nurse station, built live on stage during Day 2.
 * Styles are ready in bed-tile.scss (.tile, header, .name, .vitals, footer, .alarm, .stale, .empty).
 */
@Component({
  selector: 'wm-bed-tile',
  imports: [RouterLink],
  templateUrl: './bed-tile.html',
  styleUrl: './bed-tile.scss',
})
export class BedTile {
  readonly bed = input.required<BedId>();
  /** Ready from the start, so everyone can click through to the bed screen. */
  protected readonly slug = computed(() => toSlug(this.bed()));
}
