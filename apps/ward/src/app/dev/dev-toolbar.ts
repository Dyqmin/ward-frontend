import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthStore } from '@core/auth/auth-store';
import { MessageBus, type Role } from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';

/** Lab helper, mock mode only: switch role, pull the plug, watch every command the fake broker saw. */
@Component({
  selector: 'app-dev-toolbar',
  template: `
    @if (fake) {
      <aside class="toolbar" [class.open]="open()">
        <button type="button" class="small toggle" (click)="open.set(!open())">🛠 Dev {{ open() ? '▾' : '▸' }}</button>
        @if (open()) {
          <div class="row">
            <span class="muted">Role</span>
            @for (r of roles; track r) {
              <button type="button" class="small" [class.primary]="auth.role() === r" (click)="switchRole(r)">{{ r }}</button>
            }
          </div>
          <div class="row">
            <button type="button" class="small danger" [disabled]="!fake.connected()" (click)="fake.simulateOutage(8000)">
              Simulate outage (8 s)
            </button>
            <button type="button" class="small" (click)="fake.clearLog()">Clear log</button>
          </div>
          <table class="log">
            <thead>
              <tr>
                <th>Time</th>
                <th>Destination</th>
                <th>commandId</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              @for (e of fake.log().slice(-12).reverse(); track $index) {
                <tr>
                  <td>{{ time(e.at) }}</td>
                  <td>{{ e.destination }}</td>
                  <td class="id">{{ e.commandId?.slice(0, 8) ?? '–' }}</td>
                  <td [class.bad]="e.outcome === 'offline'" [class.warn]="e.outcome === 'duplicate'">{{ e.outcome }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="muted">No requests yet.</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </aside>
    }
  `,
  styles: `
    .toolbar {
      position: fixed;
      left: 1rem;
      bottom: 1rem;
      z-index: 15;
      display: grid;
      gap: 0.5rem;
      justify-items: start;
    }
    .toolbar.open {
      background: var(--card);
      border: 1px solid var(--warn);
      border-radius: var(--radius);
      padding: 0.75rem;
      width: min(34rem, calc(100vw - 2rem));
      box-shadow: 0 10px 30px rgb(0 0 0 / 0.45);
    }
    .toggle {
      border-color: var(--warn);
    }
    .log {
      font-size: 0.78rem;
      font-family: ui-monospace, monospace;
    }
    .log td,
    .log th {
      padding: 0.2rem 0.35rem;
    }
  `,
})
export class DevToolbar {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly bus = inject(MessageBus);
  /** null with the real broker: the toolbar only exists in mock mode. */
  protected readonly fake = this.bus instanceof FakeMessageBus ? this.bus : null;
  protected readonly roles: readonly Role[] = ['nurse', 'doctor'];
  protected readonly open = signal(false);

  protected switchRole(role: Role): void {
    this.auth.switchRole(role);
    // re-run canMatch: the same URL may now be a different screen (or /forbidden)
    void this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' });
  }

  protected time(at: number): string {
    return new Date(at).toLocaleTimeString();
  }
}
