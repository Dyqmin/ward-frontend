import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env';

import { AuthStore } from '@core/auth/auth-store';
import type { Role } from '@core/messaging/contract';
import { STOMP_MODE } from '@core/messaging/stomp-mode';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export default class Login {
  /** Bound from `?returnUrl=` by withComponentInputBinding(). */
  readonly returnUrl = input<string>();

  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly mock = inject(STOMP_MODE) === 'mock';
  protected readonly roles: readonly Role[] = ['nurse', 'doctor'];

  protected readonly name = signal('');
  protected readonly role = signal<Role>('nurse');
  protected readonly roomCode = signal(environment.defaultRoomCode);
  protected readonly useSandbox = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected async join(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.join(
        this.name().trim(),
        this.role(),
        this.roomCode().trim(),
        this.useSandbox(),
      );
      await this.router.navigateByUrl(this.returnUrl() || '/ward');
    } catch (e) {
      this.error.set(describe(e));
    } finally {
      this.busy.set(false);
    }
  }
}

function describe(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0)
      return `Backend unreachable at ${environment.apiUrl}. Start ward-worker, or add ?mock to the URL.`;
    const body: unknown = e.error;
    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string'
    )
      return body.error;
    return `${e.status} ${e.statusText}`;
  }
  return e instanceof Error ? e.message : String(e);
}
