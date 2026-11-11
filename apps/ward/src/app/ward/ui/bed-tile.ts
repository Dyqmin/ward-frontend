import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { map } from 'rxjs';

import { Clock } from '@core/clock';
import {
  MessageBus,
  toSlug,
  type BedId,
  type Patient,
} from '@core/messaging/contract';
import type { AlarmView } from '../data/alarms-store';
import { isBad } from '@perf/perf-modes';
import { check, trackInstance } from '@perf/perf-stats';
import { alarmTitle, isUrgent } from './format';
import { VitalValue } from './vital-value';
import { summary, summaryLeaky } from './vitals-summary';

/** Frames normally arrive every second; older than this and the tile says so. */
export const STALE_AFTER_SEC = 3;

@Component({
  selector: 'app-bed-tile',
  imports: [RouterLink, VitalValue, NgxSkeletonLoaderComponent],
  templateUrl: './bed-tile.html',
  styleUrl: './bed-tile.scss',
})
export class BedTile {
  readonly bed = input.required<BedId>();
  /** `undefined` while loading, `null` for an empty bed. */
  readonly patient = input<Patient | null | undefined>(undefined);
  readonly alarms = input<readonly AlarmView[]>([]);

  private readonly bus = inject(MessageBus);
  private readonly now = inject(Clock).now; // Signal<number>, ticks every second

  protected readonly slug = computed(() => toSlug(this.bed()));
  protected readonly urgent = computed(() => this.alarms().some(isUrgent));
  protected readonly alarmTitle = alarmTitle;
  protected readonly isUrgent = isUrgent;
  protected readonly check = check;

  constructor() {
    trackInstance(this, 'BedTile');
  }

  /**
   * The vitals type comes from watch() itself (PayloadOf), with no <VitalsFrame>. Age is measured
   * from when the frame ARRIVED, so a skewed server clock can't make old data look live.
   */
  readonly vitals = rxResource({
    params: () => this.bed(),
    stream: ({ params: bed }) =>
      this.bus
        .watch(`/topic/vitals.${bed}`)
        .pipe(map((frame) => ({ frame, at: Date.now() }))),
  });

  readonly ageSec = computed(() =>
    this.vitals.hasValue()
      ? Math.max(0, Math.round((this.now() - this.vitals.value().at) / 1000))
      : null,
  );
  /** Tooltip with the latest values. M4: the bad version caches it in a Map that only grows. */
  protected readonly tooltip = computed(() => {
    if (!this.vitals.hasValue()) return '';
    const frame = this.vitals.value().frame;
    return isBad('m4') ? summaryLeaky(frame) : summary(frame);
  });

  /** Stale data that looks live is the most dangerous thing this screen could do. */
  readonly stale = computed(
    () => !this.bus.connected() || (this.ageSec() ?? 0) > STALE_AFTER_SEC,
  );
}
