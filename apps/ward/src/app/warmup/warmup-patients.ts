import type { Patient } from '@core/messaging/contract';

/** Fixed, fictional patients for the warm-up. Ready-made: you don't change this file. */
export const WARMUP_PATIENTS: readonly Patient[] = [
  {
    id: 'pat_1',
    name: 'Ada Lovedrip',
    bed: 'ICU-1',
    admittedAt: '2026-09-20T08:10:00Z',
  },
  {
    id: 'pat_2',
    name: 'Ben Aspirin',
    bed: 'ICU-2',
    admittedAt: '2026-09-21T11:30:00Z',
  },
  {
    id: 'pat_3',
    name: 'Cleo Saline',
    bed: 'ICU-3',
    admittedAt: '2026-09-22T14:05:00Z',
  },
  {
    id: 'pat_4',
    name: 'Dan Pulse',
    bed: 'ICU-4',
    admittedAt: '2026-09-23T09:45:00Z',
  },
  {
    id: 'pat_5',
    name: 'Eve Bandage',
    bed: 'ER-1',
    admittedAt: '2026-09-24T22:15:00Z',
  },
  {
    id: 'pat_6',
    name: 'Finn Splint',
    bed: 'ER-2',
    admittedAt: '2026-09-25T03:40:00Z',
  },
  {
    id: 'pat_7',
    name: 'Gia Stitch',
    bed: 'ER-3',
    admittedAt: '2026-09-25T17:20:00Z',
  },
  {
    id: 'pat_8',
    name: 'Hal Rhythm',
    bed: 'CARD-1',
    admittedAt: '2026-09-19T07:55:00Z',
  },
  {
    id: 'pat_9',
    name: 'Ivy Stent',
    bed: 'CARD-2',
    admittedAt: '2026-09-22T12:00:00Z',
  },
  {
    id: 'pat_10',
    name: 'Jo Valve',
    bed: 'CARD-3',
    admittedAt: '2026-09-26T10:30:00Z',
  },
];
