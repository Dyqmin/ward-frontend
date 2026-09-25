import {
  HttpBackend,
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { LOCALE_ID, inject } from '@angular/core';
import { Observable, catchError, concat, filter, from, interval, map, mergeMap, retry, switchMap, take, tap, throwError, timer } from 'rxjs';

import { AuthStore } from '../auth/auth-store';
import { Logger } from '../logger';
import { STOMP_MODE } from '../messaging/stomp-mode';

const isReportRequest = (req: HttpRequest<unknown>) => req.url.includes('/api/reports/');

/** Per-request flag: how many times retryInterceptor may retry this GET (0 turns it off). */
export const RETRY_COUNT = new HttpContextToken<number>(() => 4);

/**
 * Mock injection — with ?mock, report downloads return a sample PDF. It is FIRST in the chain and
 * calls HttpBackend directly: the chain is short-circuited, so no real token leaks into a fake call.
 * It reuses STOMP_MODE, so one `?mock` switches both transports.
 */
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (inject(STOMP_MODE) !== 'mock' || !isReportRequest(req)) return next(req);
  const sample = new HttpRequest('GET', '/assets/sample-report.pdf', { responseType: 'blob' });
  const response$ = inject(HttpBackend)
    .handle(sample)
    .pipe(filter((e): e is HttpResponse<Blob> => e.type === HttpEventType.Response));
  if (!req.url.includes('slow=1')) return response$ as Observable<HttpEvent<unknown>>;
  // ?slow=1: fake 20 progress events over ~2 s, like the backend's chunked stream
  return response$.pipe(
    mergeMap((res) => {
      const total = res.body?.size ?? 1;
      const progress$ = interval(100).pipe(
        take(20),
        map((i): HttpEvent<unknown> => ({ type: HttpEventType.DownloadProgress, loaded: Math.round(((i + 1) / 20) * total), total })),
      );
      return concat(progress$, [res as HttpEvent<unknown>]);
    }),
  );
};

/**
 * Only /api/reports/… needs a token over HTTP (join and refresh set their own header). Tokens live
 * 10 minutes, so a 401 gets one retry with a freshly refreshed token.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isReportRequest(req)) return next(req);
  const auth = inject(AuthStore);
  const token = auth.token();
  const withToken = (t: string) => req.clone({ setHeaders: { Authorization: `Bearer ${t}` } });
  return next(token ? withToken(token) : req).pipe(
    catchError((e: unknown) =>
      e instanceof HttpErrorResponse && e.status === 401
        ? from(auth.freshToken()).pipe(switchMap((fresh) => next(withToken(fresh))))
        : throwError(() => e),
    ),
  );
};

/** Localized headers — discharge summaries come back in the nurse's language. */
export const localeInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'Accept-Language': inject(LOCALE_ID) } }));

/**
 * Exponential back-off with jitter: 500, 1000, 2000, 4000 ms. Only idempotent GETs, and only for
 * network or server errors — a 404 stays a 404.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({
      count: req.context.get(RETRY_COUNT),
      delay: (error: unknown, attempt) => {
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        if (req.method !== 'GET' || (status && status < 500)) throw error;
        return timer(Math.min(500 * 2 ** (attempt - 1), 8_000) + Math.random() * 250);
      },
    }),
  );

/** Global error logging — observe, never swallow. */
export const errorLogInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(Logger);
  return next(req).pipe(
    tap({ error: (e: HttpErrorResponse) => logger.error(`${req.method} ${req.url} → ${e.status}`, e.message) }),
  );
};

/** Reports route only: log who opened which patient's PDF. */
export const auditInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(Logger);
  const who = inject(AuthStore).participantId();
  return next(req).pipe(
    tap((e) => {
      if (e.type === HttpEventType.Response) logger.info(`AUDIT ${who ?? 'anonymous'} downloaded ${req.urlWithParams}`);
    }),
  );
};
