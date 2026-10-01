import { Component } from '@angular/core';

/** SS.1d · A second component that reads the same store. */
@Component({
  selector: 'app-my-beds-count',
  // SS.1d · show store.count() in the <strong>
  template: `<p class="count">My beds: <strong></strong></p>`,
  styles: `
    p {
      margin: 0;
    }
  `,
})
export default class MyBedsCount {}
