import { Service, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, filter, forkJoin, map, switchMap } from 'rxjs';

import { Logger } from '@core/logger';
import { ALL_BEDS, MessageBus, type BedId, type Patient } from '@core/messaging/contract';

/**
 * Who lies in which bed, for the overview screens. Loaded once per (re)connect: an instructor
 * "reset" re-seeds the ward with new patient ids, and a reconnect is how the client notices.
 * The last known list stays visible while offline.
 */
@Service()
export class PatientsStore {
  private readonly bus = inject(MessageBus);
  private readonly logger = inject(Logger);

  readonly byBed = toSignal<ReadonlyMap<BedId, Patient | null> | null, null>(
    toObservable(this.bus.connected).pipe(
      filter(Boolean),
      switchMap(() =>
        forkJoin(ALL_BEDS.map((bed) => this.bus.request('/app/patients.get', { bed }))).pipe(
          map((patients): ReadonlyMap<BedId, Patient | null> => new Map(ALL_BEDS.map((bed, i) => [bed, patients[i] ?? null]))),
          catchError((e) => {
            this.logger.warn('Loading patients failed', e);
            return EMPTY;
          }),
        ),
      ),
    ),
    { initialValue: null },
  );

  readonly loaded = computed(() => this.byBed() !== null);

  /** `undefined` while loading, `null` for an empty bed. */
  patient(bed: BedId): Patient | null | undefined {
    const all = this.byBed();
    return all ? (all.get(bed) ?? null) : undefined;
  }
}
