import { Routes } from '@angular/router';

import StreamsShell from './streams-shell';

/** Day 3: one tab per exercise under /streams. */
export default [
  {
    path: '',
    component: StreamsShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'r1' },
      {
        path: 'r1',
        title: 'R.1 subscribe',
        loadComponent: () => import('./r01-subscribe/subscribe-basics'),
      },
      {
        path: 'r2',
        title: 'R.2–3 leak',
        loadComponent: () => import('./r02-leak/leak-lab'),
      },
      {
        path: 'r4',
        title: 'R.4–5 view',
        loadComponent: () => import('./r04-view/live-hr'),
      },
      {
        path: 'r6',
        title: 'R.6 operators',
        loadComponent: () => import('./r06-operators/operators'),
      },
      {
        path: 'r7',
        title: 'R.7–8 subjects',
        loadComponent: () => import('./r07-subjects/notes'),
      },
      {
        path: 'r9',
        title: 'R.9 combine',
        loadComponent: () => import('./r09-combine/patient-filter'),
      },
      {
        path: 'r10',
        title: 'R.10–12 flattening',
        loadComponent: () => import('./r10-flattening/flattening'),
      },
      {
        path: 'r13',
        title: 'R.13 share',
        loadComponent: () => import('./r13-share/shared-hr'),
      },
    ],
  },
] satisfies Routes;
