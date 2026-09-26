import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthStore } from '@core/auth/auth-store';
import { MessageBus, type Role } from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';

/** Lab helper, mock mode only: switch role, pull the plug, watch every command the fake broker saw. */
@Component({
  selector: 'app-dev-toolbar',
  templateUrl: './dev-toolbar.html',
  styleUrl: './dev-toolbar.scss',
})
export class DevToolbar {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly bus = inject(MessageBus);
  /** null with the real broker: the toolbar only exists in mock mode. */
  protected readonly fake =
    this.bus instanceof FakeMessageBus ? this.bus : null;
  protected readonly roles: readonly Role[] = ['nurse', 'doctor'];
  protected readonly open = signal(false);

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
