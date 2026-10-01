import { Component, inject } from '@angular/core';

import { MyBedsStore } from './my-beds.store';

/** SS.1d · A second component that reads the same store. */
@Component({
  selector: 'app-my-beds-count',
  template: `<p class="count">
    My beds: <strong>{{ store.count() }}</strong>
  </p>`,
  styles: `
    p {
      margin: 0;
    }
  `,
})
export default class MyBedsCount {
  protected readonly store = inject(MyBedsStore);
}
