import { Component } from '@angular/core';

import WardPicker from './ward-picker';

/** Ready-made: the S.2 tab. You work in ward-picker.ts; the steps are at its top. */
@Component({
  selector: 'app-ward-page',
  imports: [WardPicker],
  template: `
    <h2>S.2 · An action and a reducer</h2>
    <p class="muted">
      The steps are at the top of s02-ward/ward-picker.ts. After S.2d, every
      click here shows up in the Store inspector.
    </p>
    <app-ward-picker />
  `,
  styles: `
    h2,
    p {
      margin: 0;
    }
  `,
})
export default class WardPage {}
