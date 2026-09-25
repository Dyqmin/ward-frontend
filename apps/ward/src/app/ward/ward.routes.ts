import { ActivatedRouteSnapshot, ResolveFn, Routes, nonBlocking } from '@angular/router';

import { hasRole } from '@core/auth/guards';
import { bedFromSlug } from '@core/messaging/contract';
import { medicationResource, patientResource, vitalsResource } from './bed-detail/bed-resources';
import { unsentValueGuard, validBed } from './guards';
import { stepCompleted, unsavedDraftGuard } from './med-order/guards';
import { MedOrderDraftStore } from './med-order/med-order-draft-store';

/** 'icu-3' → 'ICU-3'; with provideAppSeo() the tab reads "Drug and dose · ICU-3 · Ward Monitor". */
const bedName = (route: ActivatedRouteSnapshot) => bedFromSlug(route.params['bed'] ?? '') ?? 'Bed';
const bedTitle: ResolveFn<string> = (route) => bedName(route);

export default [
  // same URL, different screen and different bundle per role
  { path: '', title: 'Nurse station', canMatch: [hasRole('nurse')], loadComponent: () => import('./nurse-station/nurse-station') },
  { path: '', title: 'Ward rounds', canMatch: [hasRole('doctor')], loadComponent: () => import('./ward-rounds/ward-rounds') },

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
      { path: 'patient', title: 'Pick patient', loadComponent: () => import('./med-order/patient-step') },
      { path: 'drug', title: 'Drug and dose', canActivate: [stepCompleted('patient')], loadComponent: () => import('./med-order/drug-step') },
      { path: 'review', title: 'Review', canActivate: [stepCompleted('drug')], loadComponent: () => import('./med-order/review-step') },
    ],
  },
  { path: ':bed/meds/new', redirectTo: '/forbidden' }, // nurses fall through to here

  // lab: record a temperature – nurses only, one blocking resource shared with the bed detail
  {
    path: ':bed/temperature',
    title: (route) => `Record temperature · ${bedName(route)}`, // "… · ICU-3 · Ward Monitor"
    canMatch: [hasRole('nurse')],
    canActivate: [validBed],
    canDeactivate: [unsentValueGuard],
    loadComponent: () => import('./temperature/temperature-form'),
    resources: (ctx) => ({ patient: patientResource(ctx) }),
  },
  { path: ':bed/temperature', redirectTo: '/forbidden' }, // doctors fall through; the chunk is never requested

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
    }),
  },
] satisfies Routes;
