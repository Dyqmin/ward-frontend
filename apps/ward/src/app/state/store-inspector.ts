import { JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { ActionLog } from '@core/providers/store';

/**
 * Ready-made: the last actions dispatched to the Store (recorded since the app started) and the
 * whole state after them. The same two things Redux DevTools shows, without installing anything.
 */
@Component({
  selector: 'app-store-inspector',
  imports: [JsonPipe],
  templateUrl: './store-inspector.html',
  styleUrl: './store-inspector.scss',
})
export class StoreInspector {
  protected readonly state = inject(Store).selectSignal(
    (state: object) => state,
  );
  protected readonly actions = inject(ActionLog).entries;
}
