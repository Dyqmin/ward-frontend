import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env';

import { AuthStore } from '@core/auth/auth-store';
import type { Role } from '@core/messaging/contract';
import { STOMP_MODE } from '@core/messaging/stomp-mode';

@Component({
  selector: 'app-login',
  template: `
    <form class="card login" (submit)="$event.preventDefault(); join()">
      <h1>Ward Monitor</h1>
      <p class="muted">
        Join the ward as a nurse or a doctor.
        @if (mock) {
          <span class="chip warn">mock broker — no backend needed</span>
        }
      </p>

      <label>
        Name
        <input
          name="name"
          required
          maxlength="40"
          autocomplete="nickname"
          [value]="name()"
          (input)="name.set(value($event))"
        />
      </label>

      <fieldset class="roles">
        <legend class="muted">Role</legend>
        @for (r of roles; track r) {
          <label class="role" [class.selected]="role() === r">
            <input
              type="radio"
              name="role"
              [value]="r"
              [checked]="role() === r"
              (change)="role.set(r)"
            />
            {{ r === 'nurse' ? 'Nurse' : 'Doctor' }}
          </label>
        }
      </fieldset>

      <label>
        Room code
        <input
          name="room"
          required
          [value]="roomCode()"
          (input)="roomCode.set(value($event))"
        />
      </label>

      <label class="inline">
        <input
          type="checkbox"
          [checked]="useSandbox()"
          (change)="useSandbox.set(!useSandbox())"
        />
        Use my private sandbox room (for the lab)
      </label>

      @if (error(); as e) {
        <p class="error-text">{{ e }}</p>
      }

      <button
        class="primary"
        type="submit"
        [disabled]="busy() || !name().trim()"
      >
        {{ busy() ? 'Joining…' : 'Join ward' }}
      </button>
      <p class="muted small">
        All patients and values are fictional and illustrative, not clinical.
      </p>
    </form>
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
      min-height: calc(100vh - 4rem);
      padding: 1rem;
    }
    .login {
      width: min(26rem, 100%);
      display: grid;
      gap: 0.9rem;
    }
    .roles {
      border: 0;
      padding: 0;
      margin: 0;
      display: flex;
      gap: 0.5rem;
    }
    .role {
      flex: 1;
      display: flex;
      gap: 0.4rem;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.5rem 0.7rem;
      color: var(--text);
      cursor: pointer;
    }
    .role.selected {
      border-color: var(--accent);
    }
    .inline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .small {
      font-size: 0.8rem;
      margin: 0;
    }
  `,
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
