import { Component } from '@angular/core';

/** SS.2c · The counter: a second component that reads the same store. */
@Component({
  selector: 'app-alarm-counter',
  // SS.2c · store.openCount() in the <strong> · SS.2e · store.highCount() in the <span>
  template: `<p class="count">
    Open alarms: <strong></strong> · high: <span class="high"></span>
  </p>`,
  styles: `
    p {
      margin: 0;
    }
  `,
})
export default class AlarmCounter {}
