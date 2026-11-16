import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthStore } from '@core/auth/auth-store';
import { MessageBus, type Role } from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { StompMessageBus } from '@core/messaging/stomp-message-bus';

/**
 * Lab helper. Mock mode: switch role, pull the plug, watch every command the fake broker saw.
 * With the real broker only the message burst is left (it is simulated in the browser).
 */
@Component({
  selector: 'app-dev-toolbar',
  templateUrl: './dev-toolbar.html',
  styleUrl: './dev-toolbar.scss',
})
export class DevToolbar {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly bus = inject(MessageBus);
  /** null with the real broker: then only the burst button is shown. */
  protected readonly fake =
    this.bus instanceof FakeMessageBus ? this.bus : null;
  protected readonly roles: readonly Role[] = ['nurse', 'doctor'];
  protected readonly open = signal(false);

  protected burst(): void {
    if (this.bus instanceof FakeMessageBus) this.bus.burst();
    else if (this.bus instanceof StompMessageBus) this.bus.burst();
  }

  protected switchRole(role: Role): void {
    this.auth.switchRole(role);
    // re-run canMatch: the same URL may now be a different screen (or /forbidden)
    void this.router.navigateByUrl(this.router.url, {
      onSameUrlNavigation: 'reload',
    });
  }

  protected time(at: number): string {
    return new Date(at).toLocaleTimeString();
  }
}
