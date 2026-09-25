import { Routes } from '@angular/router';

import { hasRole } from '@core/auth/guards';

export default [
  // same URL, different screen and different bundle per role
  { path: '', title: 'Nurse station', canMatch: [hasRole('nurse')], loadComponent: () => import('./nurse-station/nurse-station') },
  { path: '', title: 'Ward rounds', canMatch: [hasRole('doctor')], loadComponent: () => import('./ward-rounds/ward-rounds') },
] satisfies Routes;
