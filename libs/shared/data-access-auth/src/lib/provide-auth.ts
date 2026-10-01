import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';

/** Where ward-worker's HTTP API lives (`/api/join`, `/api/token/refresh`). Same origin by default. */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => '',
});

/** A library cannot read the app's environment file: the app hands the URL in at bootstrap. */
export function provideAuth(config: { apiUrl: string }): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: API_URL, useValue: config.apiUrl },
  ]);
}
