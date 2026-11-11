import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AlarmActionsEager } from '../ui/alarm-actions.eager';
import { BedTileEager } from '../ui/bed-tile.eager';
import NurseStation from './nurse-station';

/**
 * ❌ BAD (change-detection): the same page with ChangeDetectionStrategy.Eager, all the way down.
 * Every change detection run — a vitals frame for ONE bed, a clock tick — re-checks every tile,
 * every value and every alarm row. Loaded by ward.routes.ts when change-detection is bad.
 */
@Component({
  selector: 'app-nurse-station',
  imports: [RouterLink, BedTileEager, AlarmActionsEager],
  templateUrl: './nurse-station.html',
  styleUrl: './nurse-station.scss',
  host: { 'data-cd': 'eager' }, // visible in the DOM; also keeps the component id unique
  // lint flags this — rightly. Disabled only for the ❌ demo:
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class NurseStationEager extends NurseStation {}
