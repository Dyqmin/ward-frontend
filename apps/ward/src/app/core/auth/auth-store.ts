import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { environment } from '@env';
import { firstValueFrom } from 'rxjs';

import {
  isDoctorId,
  type ParticipantId,
  type Role,
} from '../messaging/contract';
import { STOMP_MODE } from '../messaging/stomp-mode';

/** What `/api/join` and `/api/token/refresh` return. */
interface JoinResponse {
  token: string;
  participantId: ParticipantId;
  expiresAt: string;
  sharedRoom: string;
  sandboxRoom: string;
}

export interface Session extends JoinResponse {
  /** Display name typed at login (the server only returns its slug inside participantId). */
  name: string;
  /** Which of the two rooms the token opens this tab connects to. */
  useSandbox: boolean;
}

export class SessionExpiredError extends Error {
  override readonly name = 'SessionExpiredError';
}

const STORAGE_KEY = 'ward.session';

function readStored(): Session | null {
  try {
    return JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) ?? 'null',
    ) as Session | null;
  } catch {
    return null;
  }
}

@Service()
export class AuthStore {
  private readonly http = inject(HttpClient);
  private readonly mode = inject(STOMP_MODE);
  private readonly _session = signal<Session | null>(readStored());
  private refreshing: Promise<string> | null = null;

  readonly session = this._session.asReadonly();
  readonly signedIn = computed(() => this._session() !== null);
  readonly token = computed(() => this._session()?.token ?? null);
  readonly participantId = computed(
    () => this._session()?.participantId ?? null,
  );
  readonly role = computed<Role | null>(() => {
    const id = this._session()?.participantId;
    return id ? (isDoctorId(id) ? 'doctor' : 'nurse') : null;
  });
  /** The room this tab's broker connection opens: the shared ward or the private sandbox. */
  readonly room = computed(() => {
    const s = this._session();
    return s ? (s.useSandbox ? s.sandboxRoom : s.sharedRoom) : null;
  });

  async join(
    name: string,
    role: Role,
    roomCode: string,
    useSandbox = false,
  ): Promise<Session> {
    const res =
      this.mode === 'mock'
        ? mockJoin(name, role, roomCode)
        : await firstValueFrom(
            this.http.post<JoinResponse>(`${environment.apiUrl}/api/join`, {
              name,
              role,
              roomCode,
            }),
          );
    return this.store({ ...res, name, useSandbox });
  }

  /**
   * Called before every (re)connect and before authenticated downloads. Refreshing on every
   * connect means a reconnect after a long gap never presents an expired token — no timer needed.
   * Concurrent callers share one refresh. A 401 means the session is over: it is cleared.
   */
  freshToken(): Promise<string> {
    const current = this._session();
    if (!current)
      return Promise.reject(new SessionExpiredError('Not signed in'));
    if (this.mode === 'mock') return Promise.resolve(current.token);

    this.refreshing ??= firstValueFrom(
      this.http.post<JoinResponse>(
        `${environment.apiUrl}/api/token/refresh`,
        null,
        {
          headers: { Authorization: `Bearer ${current.token}` },
        },
      ),
    )
      .then((next) => this.store({ ...current, ...next }).token)
      .catch((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.logout();
          throw new SessionExpiredError(
            'Session expired, please sign in again',
          );
        }
        throw err;
      })
      .finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  /** Dev toolbar (mock mode only): the fake broker trusts whatever role the session claims. */
  switchRole(role: Role): void {
    const s = this._session();
    if (!s || this.mode !== 'mock') return;
    this.store({ ...s, ...mockJoin(s.name, role, s.sharedRoom) });
  }

  logout(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable: nothing to clear */
    }
    this._session.set(null);
  }

  private store(s: Session): Session {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* private mode: the session lives for this page only */
    }
    this._session.set(s);
    return s;
  }
}

function mockJoin(name: string, role: Role, roomCode: string): JoinResponse {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'anon';
  const participantId: ParticipantId =
    role === 'doctor' ? `dr_${slug}_mock` : `nurse_${slug}_mock`;
  return {
    token: 'mock-token',
    participantId,
    expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    sharedRoom: roomCode,
    sandboxRoom: `sandbox-${participantId}`,
  };
}
