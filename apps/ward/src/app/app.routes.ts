import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/guards';

// Default exports everywhere: loadComponent/loadChildren need no `.then()`.
export const routes: Routes = [
  { path: 'login', title: 'Sign in', loadComponent: () => import('./auth/login') },
  { path: 'forbidden', title: 'Not for your role', loadComponent: () => import('./auth/forbidden') },
  { path: 'ward', canMatch: [authGuard], loadChildren: () => import('./ward/ward.routes'), data: { preload: true } },
  { path: 'reports', canMatch: [authGuard], loadChildren: () => import('./reports/reports.routes') },
  // phones in the room game – never preloaded (see WifiAwarePreloading)
  { path: 'monitor', title: 'Monitor', canMatch: [authGuard], loadComponent: () => import('./simulator/monitor-simulator') },
  { path: 'monitor/:bed', title: 'Monitor', canMatch: [authGuard], loadComponent: () => import('./simulator/monitor-simulator') },
  { path: '', pathMatch: 'full', redirectTo: 'ward' },
  { path: '**', redirectTo: 'ward' },
];
