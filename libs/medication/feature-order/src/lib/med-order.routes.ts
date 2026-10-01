import { inject } from '@angular/core';
import {
  type ActivatedRouteSnapshot,
  type CanActivateFn,
  RedirectCommand,
  type ResolveFn,
  Router,
  type Routes,
} from '@angular/router';

import { hasRole } from '@wm/shared/data-access-auth';
import { bedFromSlug } from '@wm/shared/domain';

import { stepCompleted, unsavedDraftGuard } from './guards';
import { MedOrderDraftStore } from './med-order-draft-store';

// Separate ways: these few lines also exist in the monitoring feature. A copy is cheaper than a
// shared library that both bounded contexts would have to agree on.
const bedName = (route: ActivatedRouteSnapshot) =>
  bedFromSlug(route.params['bed'] ?? '') ?? 'Bed';
const bedTitle: ResolveFn<string> = (route) => bedName(route);
const validBed: CanActivateFn = (route) =>
  bedFromSlug(route.params['bed'] ?? '') !== null ||
  new RedirectCommand(inject(Router).parseUrl('/ward'));

/** Mounted by the app at `ward/:bed/meds/new`. */
export const medOrderRoutes = [
  // medication order wizard – doctors only, one draft per wizard
  {
    path: '',
    title: bedTitle,
    canMatch: [hasRole('doctor')],
    canActivate: [validBed],
    canDeactivate: [unsavedDraftGuard],
    providers: [MedOrderDraftStore], // a route injector: created on entry, destroyed on exit
    loadComponent: () => import('./med-order-wizard/med-order-wizard'), // header + stepper + <router-outlet>
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'patient' },
      {
        path: 'patient',
        title: 'Pick patient',
        loadComponent: () => import('./patient-step/patient-step'),
      },
      {
        path: 'drug',
        title: 'Drug and dose',
        canActivate: [stepCompleted('patient')],
        loadComponent: () => import('./drug-step/drug-step'),
      },
      {
        path: 'review',
        title: 'Review',
        canActivate: [stepCompleted('drug')],
        loadComponent: () => import('./review-step/review-step'),
      },
    ],
  },
  { path: '', pathMatch: 'prefix', redirectTo: '/forbidden' }, // nurses fall through to here
] satisfies Routes;
