import { Component, Resource, computed, inject, input } from '@angular/core';

/** What the router hands a component for a non-blocking resource: a Resource that can reload. */
type RouteResource<T> = Resource<T> & { reload(): boolean };
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { distinctUntilChanged, filter, map, mergeMap, switchMap } from 'rxjs';

import { AuthStore } from '@core/auth/auth-store';
import { Clock } from '@core/clock';
import {
  ALL_BEDS,
  MessageBus,
  bedFromSlug,
  toSlug,
  wardOf,
  type ManualReading,
  type MedOrder,
  type RpcResult,
  type VitalsFrame,
} from '@core/messaging/contract';
import { isBad } from '@perf/perf-modes';
import { trackInstance } from '@perf/perf-stats';
import { AlarmsStore } from '../data/alarms-store';
import { LiveVitals } from '../data/live-vitals';
import { PatientsStore } from '../data/patients-store';
import { AlarmActions } from '../ui/alarm-actions';
import { STALE_AFTER_SEC } from '../ui/bed-tile';
import { clock, who } from '../ui/format';
import { VitalValue } from '../ui/vital-value';
import { MedicationList } from './medication-list';
import { VitalsChart } from './vitals-chart';

@Component({
  selector: 'app-bed-detail',
  imports: [
    RouterLink,
    NgxSkeletonLoaderComponent,
    VitalValue,
    VitalsChart,
    AlarmActions,
    MedicationList,
  ],
  templateUrl: './bed-detail.html',
  styleUrl: './bed-detail.scss',
})
export default class BedDetail {
  /** Blocking resource → a plain value, never undefined: no @if, no flicker. */
  readonly patient = input.required<RpcResult<'patients.get'>>();
  /** Non-blocking resources → the whole Resource, with its loading and error signals. */
  readonly vitals = input.required<Resource<VitalsFrame[] | undefined>>();
  readonly meds = input.required<RouteResource<MedOrder[] | undefined>>();
  readonly readings = input.required<Resource<ManualReading[] | undefined>>();

  private readonly route = inject(ActivatedRoute);
  private readonly bus = inject(MessageBus);
  private readonly now = inject(Clock).now;
  private readonly auth = inject(AuthStore);
  private readonly alarmsStore = inject(AlarmsStore);

  protected readonly role = this.auth.role;
  protected readonly clock = clock;
  protected readonly who = who;
  protected readonly slug = computed(() => toSlug(this.patient().bed));
  protected readonly admitted = computed(
    () =>
      `${new Date(this.patient().admittedAt).toLocaleDateString()} ${clock(this.patient().admittedAt)}`,
  );

  protected readonly latest = computed(() =>
    this.vitals().hasValue() ? this.vitals().value()?.at(-1) : undefined,
  );
  protected readonly ageSec = computed(() => {
    const f = this.latest();
    return f ? Math.max(0, Math.round((this.now() - f.ts) / 1000)) : null;
  });
  protected readonly stale = computed(
    () => !this.bus.connected() || (this.ageSec() ?? 0) > STALE_AFTER_SEC,
  );

  private readonly wardAlarms = toSignal(
    // from the URL, not from `patient`: blocking-resource inputs are bound by a router effect, after construction
    this.route.params.pipe(
      map((p) => bedFromSlug(String(p['bed'] ?? ''))),
      filter((bed) => bed !== null),
      map(wardOf),
      distinctUntilChanged(),
      switchMap((w) => this.alarmsStore.alarms$(w)),
    ),
    { initialValue: [] },
  );
  protected readonly alarms = computed(() =>
    this.wardAlarms().filter((a) => a.event.bed === this.patient().bed),
  );

  /**
   * The bed from the URL, as a stream. "Next bed →" goes from /ward/icu-1 to /ward/icu-2 and the
   * router REUSES this component: it is not destroyed, only the params change.
   */
  private readonly bed$ = this.route.params.pipe(
    map((p) => bedFromSlug(String(p['bed'] ?? ''))),
    filter((bed) => bed !== null),
    distinctUntilChanged(),
  );

  /** The next occupied bed, across wards: how a nurse walks the round. */
  private readonly patients = inject(PatientsStore);
  protected readonly nextBed = computed(() => {
    const i = ALL_BEDS.indexOf(this.patient().bed);
    for (let k = 1; k < ALL_BEDS.length; k++) {
      const bed = ALL_BEDS[(i + k) % ALL_BEDS.length];
      if (this.patients.patient(bed) !== null) return toSlug(bed);
    }
    return null;
  });

  constructor() {
    trackInstance(this, 'BedDetail');
    const live = inject(LiveVitals);

    // The tab shows the live heart rate: "♥ 82 · ICU-3", handy when the nurse switches tabs.
    const frames$ = this.bed$.pipe(
      isBad('switch-streams')
        ? // ❌ BAD (switch-streams): mergeMap keeps EVERY inner stream. After Next bed → Next bed, the
          // title gets frames from all three beds and flickers between them. A subscribe() inside a
          // subscribe() does the same, and survives even takeUntilDestroyed().
          mergeMap((bed) => live.frames(bed))
        : // ✅ GOOD (switch-streams): switchMap closes the previous bed's stream when the next one starts.
          switchMap((bed) => live.frames(bed)),
    );

    if (isBad('forgotten-subscribe')) {
      // ❌ BAD (forgotten-subscribe): subscribe() with no end. Leaving the page does not stop it: the callback holds
      // `this`, so this component (and its DOM) stays in memory, and keeps overwriting the tab title.
      frames$.subscribe((f) => this.showInTitle(f));
    } else {
      // ✅ GOOD (forgotten-subscribe): takeUntilDestroyed() ends the subscription with the component.
      // Keep it LAST in the pipe, so it also ends the inner streams.
      frames$.pipe(takeUntilDestroyed()).subscribe((f) => this.showInTitle(f));
    }
  }

  private readonly title = inject(Title);
  private showInTitle(f: VitalsFrame): void {
    this.title.setTitle(`♥ ${f.hr} · ${f.bed}`);
  }

  /** Re-fetch without re-running guards or navigation. */
  protected refreshRecord(): void {
    this.route.resources?.['patient']?.reload();
  }

  protected reloadMeds(): void {
    this.meds().reload();
  }
}
