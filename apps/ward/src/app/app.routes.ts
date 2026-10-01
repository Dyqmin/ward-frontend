import { Routes } from '@angular/router';

import { authGuard } from '@wm/shared/data-access-auth';

// The app's own pages use default exports, so loadComponent needs no `.then()`;
// the libraries export named routes.
export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    loadComponent: () => import('./auth/login/login'),
  },
  {
    path: 'forbidden',
    title: 'Not for your role',
    loadComponent: () => import('./auth/forbidden/forbidden'),
  },
  // the medication wizard sits under a bed's URL, but it is not part of the monitoring feature
  {
    path: 'ward/:bed/meds/new',
    canMatch: [authGuard],
    loadChildren: () =>
      import('@wm/medication/feature-order').then((m) => m.medOrderRoutes),
  },
  {
    path: 'ward',
    canMatch: [authGuard],
    loadChildren: () =>
      import('@wm/monitoring/feature-station').then((m) => m.wardRoutes),
    data: { preload: true },
  },
  {
    path: 'reports',
    canMatch: [authGuard],
    loadChildren: () => import('./reports/reports.routes'),
  },
  // phones in the room game – never preloaded (see WifiAwarePreloading)
  {
    path: 'monitor',
    title: 'Monitor',
    canMatch: [authGuard],
    loadComponent: () => import('./simulator/monitor-simulator'),
  },
  {
    path: 'monitor/:bed',
    title: 'Monitor',
    canMatch: [authGuard],
    loadComponent: () => import('./simulator/monitor-simulator'),
  },
  { path: '', pathMatch: 'full', redirectTo: 'ward' },
  { path: '**', redirectTo: 'ward' },
];
