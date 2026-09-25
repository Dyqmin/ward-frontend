import { Component, computed, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { AuthStore } from '@core/auth/auth-store';
import { ConnectionBadge } from '@core/ui/connection-badge';
import { ToastOutlet } from '@core/ui/toast-outlet';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConnectionBadge, ToastOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  /** The phone simulator is a bare page: no chrome. */
  protected readonly bare = computed(() => this.url().startsWith('/monitor'));
  protected readonly displayName = computed(() => {
    const s = this.auth.session();
    return s ? `${s.name} · ${this.auth.role()}` : '';
  });

  constructor() {
    // session ended (logout, or a refresh answered 401): back to the join page
    effect(() => {
      if (!this.auth.signedIn() && !this.router.url.startsWith('/login')) {
        void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      }
    });
  }

  protected logout(): void {
    this.auth.logout();
  }
}
