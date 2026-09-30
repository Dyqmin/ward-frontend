import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';

import { checklistFeature } from './s01-checklist/checklist.feature';
import { wardFeature } from './s02-ward/ward.feature';
import { alarmsFeature } from './s04-alarms/alarms.feature';
import StateShell from './state-shell';

/** Day 4: one tab per exercise under /state. */
export default [
  {
    path: '',
    component: StateShell,
    // The Store slices (and later the effects) of this page. Every tab shares them, so the state
    // survives switching tabs. The S.1 checklist is ready-made; the exercises add the rest here.
    providers: [
      provideState(checklistFeature),
      provideState(wardFeature), // S.2c
      provideState(alarmsFeature), // S.4b
      // S.5b · the alarms effects
    ],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 's1' },
      {
        path: 's1',
        title: 'S.1 look',
        loadComponent: () => import('./s01-checklist/checklist'),
      },
      {
        path: 's2',
        title: 'S.2 ward',
        loadComponent: () => import('./s02-ward/ward-page'),
      },
      {
        path: 's3',
        title: 'S.3 selectors',
        loadComponent: () => import('./s03-selectors/ward-overview'),
      },
      {
        path: 's4',
        title: 'S.4–8 alarms',
        loadComponent: () => import('./s04-alarms/alarms-board'),
      },
    ],
  },
] satisfies Routes;
