import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ConnectionBadge } from '@core/ui/connection-badge';
import { ToastOutlet } from '@core/ui/toast-outlet';
import { PerfPanel } from '@perf/perf-panel';
import { App } from './app';
import { DevToolbar } from './dev/dev-toolbar';

/**
 * ❌ BAD (change-detection): the same shell, checked on EVERY change detection run.
 * Same template, same code — only the strategy differs. Bootstrapped by main.ts when change-detection is bad.
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ConnectionBadge,
    ToastOutlet,
    DevToolbar,
    PerfPanel,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { 'data-cd': 'eager' }, // visible in the DOM; also keeps the component id unique
  // lint flags this — rightly. Disabled only for the ❌ demo:
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AppEager extends App {}
