import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/guards';
import Forbidden from './auth/forbidden';
import Login from './auth/login';
import reportRoutes from './reports/reports.routes';
import MonitorSimulator from './simulator/monitor-simulator';
import NurseStation from './ward/nurse-station/nurse-station';
import wardRoutes from './ward/ward.routes';

/**
 * ❌ BAD (lazy-loading): every route imported up front. All of it lands in the initial bundle, so every user
 * downloads (and the browser parses) the login, the phone simulator and the PDF reports before the
 * first screen shows. Built only by `pnpm build:eager`, which swaps it in for app.routes.ts.
 * Compare "Initial total" with `pnpm build`.
 */
export const routes: Routes = [
  { path: 'login', title: 'Sign in', component: Login },
  { path: 'forbidden', title: 'Not for your role', component: Forbidden },
  {
    path: 'ward',
    canMatch: [authGuard],
    children: [
      // the nurse station imported statically too, so even a nested page can be eager
      { ...wardRoutes[0], loadComponent: undefined, component: NurseStation },
      ...wardRoutes.slice(1),
    ],
  },
  { path: 'reports', canMatch: [authGuard], children: reportRoutes },
  {
    path: 'monitor',
    title: 'Monitor',
    canMatch: [authGuard],
    component: MonitorSimulator,
  },
  {
    path: 'monitor/:bed',
    title: 'Monitor',
    canMatch: [authGuard],
    component: MonitorSimulator,
  },
  { path: '', pathMatch: 'full', redirectTo: 'ward' },
  { path: '**', redirectTo: 'ward' },
];
