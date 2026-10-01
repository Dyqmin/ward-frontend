import { Component, input } from '@angular/core';

/** What a list shows when it has nothing to show. */
@Component({
  selector: 'wm-empty-state',
  template: '<p>{{ message() }}</p>',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly message = input.required<string>();
}
