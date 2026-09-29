import { Component, signal } from '@angular/core';

import { LeakyVitals } from './leaky-vitals';

/** Ready-made host for R.2 and R.3: Open shows LeakyVitals, Close removes (destroys) it. */
@Component({
  selector: 'app-leak-lab',
  imports: [LeakyVitals],
  templateUrl: './leak-lab.html',
  styleUrl: './leak-lab.scss',
})
export default class LeakLab {
  protected readonly open = signal(false);
}
