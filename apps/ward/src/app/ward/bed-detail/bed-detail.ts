import {
  Component,
  computed,
  inject,
  input,
  Resource,
  signal,
} from '@angular/core';

/** What the router hands a component for a non-blocking resource: a Resource that can reload. */
type RouteResource<T> = Resource<T> & { reload(): boolean };
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs';

import { AuthStore } from '@wm/shared/data-access-auth';
import {
  bedFromSlug,
  type ManualReading,
  type MedOrder,
  type RpcResult,
  toSlug,
  type VitalsFrame,
  wardOf,
  who,
} from '@wm/shared/domain';
import { AlarmsStore } from '../data/alarms-store';
import { AlarmActions } from '../ui/alarm-actions';
import { clock } from '@wm/shared/util-dates';
import { MedicationList } from './components/medication-list/medication-list';
import { VitalsChart } from './components/vitals-chart/vitals-chart';
import { VitalsCard } from './vitals/vitals-card/vitals-card';

@Component({
  selector: 'app-bed-detail',
  imports: [
    RouterLink,
    NgxSkeletonLoaderComponent,
    VitalsChart,
    VitalsCard,
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
  private readonly auth = inject(AuthStore);
  private readonly alarmsStore = inject(AlarmsStore);

  /** The bed screen owns "paused"; the vitals card binds it two-way. */
  protected readonly paused = signal(false);
  protected readonly role = this.auth.role;
  protected readonly clock = clock;
  protected readonly who = who;
  protected readonly slug = computed(() => toSlug(this.patient().bed));
  protected readonly admitted = computed(
    () =>
      `${new Date(this.patient().admittedAt).toLocaleDateString()} ${clock(this.patient().admittedAt)}`,
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

  /** Re-fetch without re-running guards or navigation. */
  protected refreshRecord(): void {
    this.route.resources?.['patient']?.reload();
  }

  protected reloadMeds(): void {
    this.meds().reload();
  }
}
