import { Component, inject } from '@angular/core';

import { AlarmsStore } from './alarms.store';

/** SS.2c · The counter: a second component that reads the same store. */
@Component({
  selector: 'app-alarm-counter',
  template: `<p class="count">
    Open alarms: <strong>{{ store.openCount() }}</strong> · high:
    <span class="high">{{ store.highCount() }}</span>
  </p>`,
  styles: `
    p {
      margin: 0;
    }
  `,
})
export default class AlarmCounter {
  protected readonly store = inject(AlarmsStore);
}
