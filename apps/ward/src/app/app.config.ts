import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withAutoCleanupInjectors,
  withComponentInputBinding,
  withNavigationErrorHandler,
  withPreloading,
  withRouterResources,
} from '@angular/router';
import { environment } from '@env';

import {
  authInterceptor,
  errorLogInterceptor,
  localeInterceptor,
  mockInterceptor,
  retryInterceptor,
} from '@core/http/interceptors';
import { handleNavigationError } from '@core/navigation-errors';
import {
  provideStomp,
  withAuthToken,
  withErrorLogging,
  withExponentialReconnect,
} from '@core/messaging/provide-stomp';
import { provideAppSeo } from '@core/providers/seo';
import { provideSkeletonConfig } from '@core/providers/skeleton';
import { WifiAwarePreloading } from '@core/providers/wifi-aware-preloading';
import { routes } from './app.routes';

// Reads like a table of contents: one provideX() per concern, each in its own file.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(), // route params, query params, data and resources become inputs
      withRouterResources(), // developer preview (22.2): `resources` on routes
      withAutoCleanupInjectors(), // route injectors (and their providers) are destroyed when left
      withPreloading(WifiAwarePreloading),
      withNavigationErrorHandler(handleNavigationError), // unwraps RedirectCommand thrown by resource loaders
    ),
    // PDF reports only; mock first so it can short-circuit the chain
    provideHttpClient(
      withInterceptors([
        mockInterceptor,
        authInterceptor,
        localeInterceptor,
        retryInterceptor,
        errorLogInterceptor,
      ]),
    ),
    // everything live
    provideStomp(
      {
        brokerURL: `${environment.wsUrl}/rooms/{room}/ws`,
        debug: () => undefined /* (m) => console.debug(m) */,
      },
      withAuthToken(),
      withExponentialReconnect({ initialMs: 500, maxMs: 15_000 }),
      withErrorLogging(),
    ),
    provideAppSeo({ siteName: 'Ward Monitor' }),
    provideSkeletonConfig(),
  ],
};
