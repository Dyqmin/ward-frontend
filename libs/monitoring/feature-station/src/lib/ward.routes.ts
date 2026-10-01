import {
  ActivatedRouteSnapshot,
  nonBlocking,
  ResolveFn,
  Routes,
} from '@angular/router';

import {
  manualReadingsResource,
  medicationResource,
  vitalsResource,
} from '@wm/monitoring/data-access';
import { patientResource } from '@wm/patient/api';
import { hasRole } from '@wm/shared/data-access-auth';
import { bedFromSlug } from '@wm/shared/domain';

import { unsentValueGuard, validBed } from './guards';

/** 'icu-3' → 'ICU-3'; with provideAppSeo() the tab reads "ICU-3 · Ward Monitor". */
const bedName = (route: ActivatedRouteSnapshot) =>
  bedFromSlug(route.params['bed'] ?? '') ?? 'Bed';
const bedTitle: ResolveFn<string> = (route) => bedName(route);

export const wardRoutes = [
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
      readings: nonBlocking(manualReadingsResource(ctx)),
    }),
  },
] satisfies Routes;
