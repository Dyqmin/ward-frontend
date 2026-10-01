import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Ready-made: the Day 4 afternoon page, one tab per exercise. */
@Component({
  selector: 'app-signal-store-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './signal-store-shell.html',
  styleUrl: './signal-store-shell.scss',
})
export default class SignalStoreShell {
  protected readonly tabs = [
    { path: 'ss1', label: 'SS.1 my beds' },
    { path: 'ss2', label: 'SS.2 alarms' },
    { path: 'ss3', label: 'SS.3 local' },
    { path: 'ss4', label: 'SS.4–6 search' },
    { path: 'ss7', label: 'SS.7–9 entities' },
    { path: 'ss10', label: 'SS.10–12 live' },
  ];
}
