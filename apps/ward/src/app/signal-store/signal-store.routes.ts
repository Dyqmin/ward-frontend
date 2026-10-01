import { Routes } from '@angular/router';

import SignalStoreShell from './signal-store-shell';

/** Day 4 afternoon: one tab per exercise under /signal-store. */
export default [
  {
    path: '',
    component: SignalStoreShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ss1' },
      {
        path: 'ss1',
        title: 'SS.1 my beds',
        loadComponent: () => import('./ss01-my-beds/my-beds'),
      },
      {
        path: 'ss2',
        title: 'SS.2 alarms',
        loadComponent: () => import('./ss02-alarms/alarms-page'),
      },
      {
        path: 'ss3',
        title: 'SS.3 local',
        loadComponent: () => import('./ss03-local/notes-page'),
      },
      {
        path: 'ss4',
        title: 'SS.4–6 search',
        loadComponent: () => import('./ss04-search/patient-search'),
      },
      {
        path: 'ss7',
        title: 'SS.7–9 entities',
        loadComponent: () => import('./ss07-entities/alarm-board'),
      },
      {
        path: 'ss10',
        title: 'SS.10–12 live',
        loadComponent: () => import('./ss10-live/live-alarms'),
      },
    ],
  },
] satisfies Routes;
