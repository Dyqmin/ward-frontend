import { Component, input } from '@angular/core';

@Component({
  selector: 'wm-stat-tile',
  imports: [],
  templateUrl: './stat-tile.html',
  styleUrl: './stat-tile.scss',
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly unit = input('');
}
