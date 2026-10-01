import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/guards';

// Default exports everywhere: loadComponent/loadChildren need no `.then()`.
export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    loadComponent: () => import('./auth/login'),
  },
  {
    path: 'forbidden',
    title: 'Not for your role',
    loadComponent: () => import('./auth/forbidden'),
  },
  {
    path: 'ward',
    canMatch: [authGuard],
    loadChildren: () => import('./ward/ward.routes'),
    data: { preload: true },
  },
  // Day 2, exercise 0: the signals warm-up on fixed data
  {
    path: 'warmup',
    title: 'Signals warm-up',
    canMatch: [authGuard],
    loadComponent: () => import('./warmup/warmup'),
  },
  // Day 3: observables and RxJS, one tab per exercise
  {
    path: 'streams',
    title: 'Streams',
    canMatch: [authGuard],
    loadChildren: () => import('./streams/streams.routes'),
  },
  // Day 4: the NgRx global Store, one tab per exercise
  {
    path: 'state',
    title: 'State',
    canMatch: [authGuard],
    loadChildren: () => import('./state/state.routes'),
  },
  // Day 4 afternoon: NgRx SignalStore, one tab per exercise
  {
    path: 'signal-store',
    title: 'Signal Store',
    canMatch: [authGuard],
    loadChildren: () => import('./signal-store/signal-store.routes'),
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
