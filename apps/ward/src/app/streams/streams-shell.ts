import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MessageBus } from '@core/messaging/contract';

/** Ready-made: the Day 3 page with one tab per exercise and the live subscription counter. */
@Component({
  selector: 'app-streams-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './streams-shell.html',
  styleUrl: './streams-shell.scss',
})
export default class StreamsShell {
  /** Counts open vitals subscriptions, with the real broker and with ?mock alike. */
  protected readonly bus = inject(MessageBus);

  protected readonly tabs = [
    { path: 'r1', label: 'R.1 subscribe' },
    { path: 'r2', label: 'R.2–3 leak' },
    { path: 'r4', label: 'R.4–5 view' },
    { path: 'r6', label: 'R.6 operators' },
    { path: 'r7', label: 'R.7–8 subjects' },
    { path: 'r9', label: 'R.9 combine' },
    { path: 'r10', label: 'R.10–12 flattening' },
    { path: 'r13', label: 'R.13 share' },
  ];
}
