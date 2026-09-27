import {
  ActivatedRouteSnapshot,
  ResolveFn,
  Routes,
  nonBlocking,
} from '@angular/router';

import { hasRole } from '@core/auth/guards';
import { bedFromSlug } from '@core/messaging/contract';
import {
  manualReadingsResource,
  medicationResource,
  patientResource,
  vitalsResource,
} from './bed-detail/bed-resources';
import { validBed } from './guards';
import { stepCompleted, unsavedDraftGuard } from './med-order/guards';
import { MedOrderDraftStore } from './med-order/med-order-draft-store';

/** 'icu-3' → 'ICU-3'; with provideAppSeo() the tab reads "Drug and dose · ICU-3 · Ward Monitor". */
const bedName = (route: ActivatedRouteSnapshot) =>
  bedFromSlug(route.params['bed'] ?? '') ?? 'Bed';
const bedTitle: ResolveFn<string> = (route) => bedName(route);

export default [
  // same URL, different screen and different bundle per role
  {
    path: '',
    title: 'Nurse station',
    canMatch: [hasRole('nurse')],
    loadComponent: () => import('./nurse-station/nurse-station'),
  },
  {
    path: '',
    title: 'Ward rounds',
    canMatch: [hasRole('doctor')],
    loadComponent: () => import('./ward-rounds/ward-rounds'),
  },

  // medication order wizard – doctors only, one draft per wizard
  {
    path: ':bed/meds/new',
    title: bedTitle,
    canMatch: [hasRole('doctor')],
    canActivate: [validBed],
    canDeactivate: [unsavedDraftGuard],
    providers: [MedOrderDraftStore], // a route injector: created on entry, destroyed on exit
    loadComponent: () => import('./med-order/med-order-wizard'), // header + stepper + <router-outlet>
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'patient' },
      {
        path: 'patient',
        title: 'Pick patient',
        loadComponent: () => import('./med-order/patient-step'),
      },
      {
        path: 'drug',
        title: 'Drug and dose',
        canActivate: [stepCompleted('patient')],
        loadComponent: () => import('./med-order/drug-step'),
      },
      {
        path: 'review',
        title: 'Review',
        canActivate: [stepCompleted('drug')],
        loadComponent: () => import('./med-order/review-step'),
      },
    ],
  },
  { path: ':bed/meds/new', redirectTo: '/forbidden' }, // nurses fall through to here

  // LAB TASK 2 · record a temperature. Fill in the two TODOs; the medication wizard above is a model.
  {
    path: ':bed/temperature',
    title: 'Record temperature',
    canMatch: [], // TODO: nurses only (hasRole)
    canActivate: [validBed], // 'icu-9' → back to /ward: validBed → bedFromSlug → your isBedId
    canDeactivate: [], // TODO: ask before losing a typed value (unsentValueGuard in ./guards)
    loadComponent: () => import('./temperature/temperature-form'),
    resources: (ctx) => ({ patient: patientResource(ctx) }), // blocking: the same record as the bed detail
  },
  // TODO: everyone else must land on /forbidden. Add a second ':bed/temperature' route that
  // redirects there, like the wizard's second route. When canMatch says no, the router tries it.

  // bed detail – the route says WHAT data the screen needs; the component only renders it
  {
    path: ':bed',
    canActivate: [validBed],
    title: bedTitle,
    loadComponent: () => import('./bed-detail/bed-detail'),
    resources: (ctx) => ({
      patient: patientResource(ctx), // blocking: the record must exist before the page shows
      vitals: nonBlocking(vitalsResource(ctx)), // non-blocking: snapshot first, then the live stream
      meds: nonBlocking(medicationResource(ctx)),
      readings: nonBlocking(manualReadingsResource(ctx)),
    }),
  },
] satisfies Routes;
