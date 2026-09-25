import { Routes, nonBlocking } from '@angular/router';

import { hasRole } from '@core/auth/guards';
import { bedFromSlug } from '@core/messaging/contract';
import { medicationResource, patientResource, vitalsResource } from './bed-detail/bed-resources';
import { validBed } from './guards';

export default [
  // same URL, different screen and different bundle per role
  { path: '', title: 'Nurse station', canMatch: [hasRole('nurse')], loadComponent: () => import('./nurse-station/nurse-station') },
  { path: '', title: 'Ward rounds', canMatch: [hasRole('doctor')], loadComponent: () => import('./ward-rounds/ward-rounds') },

  // bed detail – the route says WHAT data the screen needs; the component only renders it
  {
    path: ':bed',
    canActivate: [validBed],
    title: (route) => bedFromSlug(route.params['bed'] ?? '') ?? 'Bed', // "ICU-3 · Ward Monitor" via provideAppSeo()
    loadComponent: () => import('./bed-detail/bed-detail'),
    resources: (ctx) => ({
      patient: patientResource(ctx), // blocking: the record must exist before the page shows
      vitals: nonBlocking(vitalsResource(ctx)), // non-blocking: snapshot first, then the live stream
      meds: nonBlocking(medicationResource(ctx)),
    }),
  },
] satisfies Routes;
