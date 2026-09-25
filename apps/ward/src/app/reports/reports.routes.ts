import { provideHttpClient, withInterceptors, withRequestsMadeViaParent } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, ResolveFn, Router, Routes } from '@angular/router';

import { auditInterceptor } from '@core/http/interceptors';
import { Reports, isReportKind } from '@core/http/reports';
import { bedFromSlug } from '@core/messaging/contract';

const validReport: CanActivateFn = (route) =>
  (isReportKind(route.params['kind'] ?? '') && bedFromSlug(route.params['bed'] ?? '') !== null) ||
  new RedirectCommand(inject(Router).parseUrl('/ward'));

const reportTitle: ResolveFn<string> = (route) =>
  `${route.params['kind'] === 'lab' ? 'Lab report' : 'Discharge summary'} · ${bedFromSlug(route.params['bed'] ?? '') ?? ''}`;

export default [
  {
    path: '',
    providers: [
      // this feature gets its OWN HttpClient with its OWN interceptors…
      provideHttpClient(
        withInterceptors([auditInterceptor]), // logs who opened which patient's PDF
        withRequestsMadeViaParent(), // …then runs the root chain: mock, auth, locale, retry, error log
      ),
      Reports,
    ],
    children: [
      { path: ':kind/:bed', title: reportTitle, canActivate: [validReport], loadComponent: () => import('./report-download') },
    ],
  },
] satisfies Routes;
