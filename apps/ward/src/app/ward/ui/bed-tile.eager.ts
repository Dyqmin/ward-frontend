import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';

import { AlarmChipPipe } from './alarm-chip.pipe';
import { BedTile } from './bed-tile';
import { VitalValueEager } from './vital-value.eager';

/** ❌ BAD (P1): the same tile, checked every time its parent is — whether anything changed or not. */
@Component({
  selector: 'app-bed-tile',
  imports: [
    RouterLink,
    VitalValueEager,
    NgxSkeletonLoaderComponent,
    AlarmChipPipe,
  ],
  templateUrl: './bed-tile.html',
  styleUrl: './bed-tile.scss',
  host: { 'data-cd': 'eager' }, // visible in the DOM; also keeps the component id unique
  // lint flags this — rightly. Disabled only for the ❌ demo:
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class BedTileEager extends BedTile {}
