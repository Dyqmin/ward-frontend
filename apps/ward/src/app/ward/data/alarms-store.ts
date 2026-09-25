import { Service, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  Observable,
  catchError,
  distinctUntilChanged,
  filter,
  finalize,
  interval,
  map,
  merge,
  of,
  scan,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';

import { Logger } from '@core/logger';
import { MessageBus, WARDS, type AlarmEvent, type AlarmId, type Ward } from '@core/messaging/contract';

type AlarmState = ReadonlyMap<AlarmId, AlarmEvent>;

/** The newest event per alarmId wins. */
export function reduceAlarms(state: AlarmState, e: AlarmEvent): AlarmState {
  const next = new Map(state);
  next.set(e.alarmId, e);
  return next;
}

/** Endings are silent unless the instructor enables emitResolved, so the snapshot is re-fetched this often. */
export const ALARM_RESYNC_MS = 30_000;

/**
 * Active alarms per ward: snapshot, then stream.
 *
 * 1. Subscribe to /topic/alarms.{ward} FIRST (and buffer),
 * 2. fetch the `alarms.active` snapshot,
 * 3. apply the snapshot, then every buffered and live event,
 * 4. do it again after every reconnect (events sent while offline are not replayed) and every 30 s.
 */
@Service()
export class AlarmsStore {
  private readonly bus = inject(MessageBus);
  private readonly logger = inject(Logger);
  private readonly connected$ = toObservable(this.bus.connected);
  private readonly cache = new Map<Ward, Observable<AlarmEvent[]>>();

  alarms$(ward: Ward): Observable<AlarmEvent[]> {
    let cached = this.cache.get(ward);
    if (!cached) {
      cached = this.load(ward).pipe(shareReplay({ bufferSize: 1, refCount: true }));
      this.cache.set(ward, cached);
    }
    return cached;
  }

  /** All three wards, for the overview screens. */
  all$(): Observable<AlarmEvent[]> {
    const perWard = WARDS.map((w) => this.alarms$(w).pipe(startWith([] as AlarmEvent[])));
    return merge(...perWard.map((a$, i) => a$.pipe(map((alarms) => [i, alarms] as const)))).pipe(
      scan((acc, [i, alarms]) => acc.map((prev, j) => (j === i ? alarms : prev)), WARDS.map(() => [] as AlarmEvent[])),
      map((lists) => lists.flat()),
    );
  }

  private load(ward: Ward): Observable<AlarmEvent[]> {
    const resync$ = merge(
      this.connected$.pipe(distinctUntilChanged(), filter(Boolean)), // every (re)connect
      interval(ALARM_RESYNC_MS).pipe(filter(() => this.bus.connected())),
    );
    return resync$.pipe(
      switchMap(() => {
        const live$ = this.bus.watch(`/topic/alarms.${ward}`).pipe(shareReplay()); // replays what arrives before the snapshot
        const buffered = live$.subscribe(); // start listening before asking for the snapshot
        return this.bus.request('/app/alarms.active', { ward }).pipe(
          switchMap((snapshot) => {
            const initial: AlarmState = new Map(snapshot.map((a) => [a.alarmId, a]));
            return live$.pipe(scan(reduceAlarms, initial), startWith(initial));
          }),
          catchError((e) => {
            this.logger.warn(`Alarm snapshot for ${ward} failed`, e);
            return of(null); // keep showing the last state until the next resync
          }),
          finalize(() => buffered.unsubscribe()),
        );
      }),
      filter((state): state is AlarmState => state !== null),
      map((state) => [...state.values()]),
    );
  }
}
