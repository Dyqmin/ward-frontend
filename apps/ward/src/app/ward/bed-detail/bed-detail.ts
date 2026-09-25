import { Component, Resource, computed, inject, input } from '@angular/core';

/** What the router hands a component for a non-blocking resource: a Resource that can reload. */
type RouteResource<T> = Resource<T> & { reload(): boolean };
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs';

import { AuthStore } from '@core/auth/auth-store';
import { Clock } from '@core/clock';
import {
  MessageBus,
  bedFromSlug,
  toSlug,
  wardOf,
  type MedOrder,
  type RpcResult,
  type VitalsFrame,
} from '@core/messaging/contract';
import { AlarmsStore } from '../data/alarms-store';
import { AlarmActions } from '../ui/alarm-actions';
import { STALE_AFTER_SEC } from '../ui/bed-tile';
import { clock } from '../ui/format';
import { VitalValue } from '../ui/vital-value';
import { MedicationList } from './medication-list';
import { VitalsChart } from './vitals-chart';

@Component({
  selector: 'app-bed-detail',
  imports: [RouterLink, NgxSkeletonLoaderComponent, VitalValue, VitalsChart, AlarmActions, MedicationList],
  templateUrl: './bed-detail.html',
  styleUrl: './bed-detail.scss',
})
export default class BedDetail {
  /** Blocking resource → a plain value, never undefined: no @if, no flicker. */
  readonly patient = input.required<RpcResult<'patients.get'>>();
  /** Non-blocking resources → the whole Resource, with its loading and error signals. */
  readonly vitals = input.required<Resource<VitalsFrame[] | undefined>>();
  readonly meds = input.required<RouteResource<MedOrder[] | undefined>>();

  private readonly route = inject(ActivatedRoute);
  private readonly bus = inject(MessageBus);
  private readonly now = inject(Clock).now;
  private readonly auth = inject(AuthStore);
  private readonly alarmsStore = inject(AlarmsStore);

  protected readonly role = this.auth.role;
  protected readonly slug = computed(() => toSlug(this.patient().bed));
  protected readonly admitted = computed(() => `${new Date(this.patient().admittedAt).toLocaleDateString()} ${clock(this.patient().admittedAt)}`);

  protected readonly latest = computed(() => (this.vitals().hasValue() ? this.vitals().value()?.at(-1) : undefined));
  protected readonly ageSec = computed(() => {
    const f = this.latest();
    return f ? Math.max(0, Math.round((this.now() - f.ts) / 1000)) : null;
  });
  protected readonly stale = computed(() => !this.bus.connected() || (this.ageSec() ?? 0) > STALE_AFTER_SEC);

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
  protected readonly alarms = computed(() => this.wardAlarms().filter((a) => a.event.bed === this.patient().bed));

  /** Re-fetch without re-running guards or navigation. */
  protected refreshRecord(): void {
    this.route.resources?.['patient']?.reload();
  }

  protected reloadMeds(): void {
    this.meds().reload();
  }
}
