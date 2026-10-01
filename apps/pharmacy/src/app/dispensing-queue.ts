import type { MedOrder } from '@wm/shared/domain';

/**
 * Dummy data: the pharmacy team has no backend of its own yet. The orders use the same
 * MedOrder type as the ward app, from the shared kernel (@wm/shared/domain).
 */
export const DISPENSING_QUEUE: readonly MedOrder[] = [
  {
    id: 'med_101',
    patientId: 'pat_3',
    drug: 'Paracetamol',
    doseMg: 1000,
    route: 'oral',
    status: 'ordered',
    orderedBy: 'dr_house',
    createdAt: '2026-10-05T08:10:00Z',
  },
  {
    id: 'med_102',
    patientId: 'pat_7',
    drug: 'Ceftriaxone',
    doseMg: 2000,
    route: 'iv',
    status: 'ordered',
    orderedBy: 'dr_grey',
    createdAt: '2026-10-05T08:25:00Z',
  },
  {
    id: 'med_103',
    patientId: 'pat_12',
    drug: 'Metoprolol',
    doseMg: 50,
    route: 'oral',
    status: 'given',
    orderedBy: 'dr_house',
    createdAt: '2026-10-05T07:40:00Z',
  },
  {
    id: 'med_104',
    patientId: 'pat_5',
    drug: 'Furosemide',
    doseMg: 40,
    route: 'iv',
    status: 'ordered',
    orderedBy: 'dr_grey',
    createdAt: '2026-10-05T08:55:00Z',
  },
];
