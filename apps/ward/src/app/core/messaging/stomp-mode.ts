import { InjectionToken } from '@angular/core';

export type StompMode = 'real' | 'mock';

const STORAGE_KEY = 'ward.mock';

/**
 * `?mock` in the URL swaps the whole messaging layer (and report downloads) for in-memory fakes.
 * The choice is remembered for the browser tab, so it survives navigation and reloads;
 * `?mock=0` switches back to the real broker.
 */
export const STOMP_MODE = new InjectionToken<StompMode>('STOMP_MODE', {
  providedIn: 'root',
  factory: detectStompMode,
});

export function detectStompMode(): StompMode {
  if (typeof location === 'undefined') return 'real';
  const params = new URLSearchParams(location.search);
  try {
    if (params.has('mock')) {
      const on = !['0', 'false', 'off'].includes(params.get('mock') ?? '');
      if (on) sessionStorage.setItem(STORAGE_KEY, '1');
      else sessionStorage.removeItem(STORAGE_KEY);
      return on ? 'mock' : 'real';
    }
    return sessionStorage.getItem(STORAGE_KEY) === '1' ? 'mock' : 'real';
  } catch {
    return params.has('mock') ? 'mock' : 'real';
  }
}
