import { Service, signal } from '@angular/core';
import { Observable, firstValueFrom, map, timer } from 'rxjs';

import type { BedId, Patient } from '@core/messaging/contract';
import { WARMUP_PATIENTS } from '../warmup/warmup-patients';

// Ready-made data for the Day 4 SignalStore exercises. You don't change this file.

export interface DemoAlarm {
  id: string;
  bed: BedId;
  title: string;
  severity: 'high' | 'low';
  acknowledged: boolean;
}

/** SS.2, SS.7 · Fixed alarms: 4 open (2 high), 1 already acknowledged. */
export const DEMO_ALARMS: readonly DemoAlarm[] = [
  {
    id: 'a1',
    bed: 'ICU-1',
    title: 'HR high',
    severity: 'high',
    acknowledged: false,
  },
  {
    id: 'a2',
    bed: 'ICU-3',
    title: 'SpO₂ low',
    severity: 'high',
    acknowledged: false,
  },
  {
    id: 'a3',
    bed: 'ER-2',
    title: 'RR high',
    severity: 'low',
    acknowledged: false,
  },
  {
    id: 'a4',
    bed: 'CARD-1',
    title: 'HR low',
    severity: 'low',
    acknowledged: false,
  },
  {
    id: 'a5',
    bed: 'ER-4',
    title: 'HR high',
    severity: 'high',
    acknowledged: true,
  },
];

/** SS.7–9 · Waits, like a slow server. `await pause(500)` */
export const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** SS.4–6 · How long the directory takes to answer. */
export const DIRECTORY_DELAY_MS = 500;

/**
 * SS.4–6 · A slow patient directory, no server needed: it answers after 500 ms and counts every
 * request it gets. search() returns a Promise, search$() an Observable.
 */
@Service()
export class PatientDirectory {
  readonly requests = signal(0);

  search(term: string): Promise<Patient[]> {
    return firstValueFrom(this.search$(term));
  }

  search$(term: string): Observable<Patient[]> {
    return new Observable<Patient[]>((subscriber) => {
      this.requests.update((n) => n + 1);
      const needle = term.trim().toLowerCase();
      return timer(DIRECTORY_DELAY_MS)
        .pipe(
          map(() =>
            WARMUP_PATIENTS.filter((p) =>
              p.name.toLowerCase().includes(needle),
            ),
          ),
        )
        .subscribe(subscriber);
    });
  }
}
