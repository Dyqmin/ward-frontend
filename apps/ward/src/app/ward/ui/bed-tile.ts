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
import { calc, check, trackInstance } from '@perf/perf-stats';
import { AlarmChipPipe } from './alarm-chip.pipe';
import { chipText, isUrgent } from './format';
import { VitalValue } from './vital-value';

/** Frames normally arrive every second; older than this and the tile says so. */
export const STALE_AFTER_SEC = 3;

@Component({
  selector: 'app-bed-tile',
  imports: [RouterLink, VitalValue, NgxSkeletonLoaderComponent, AlarmChipPipe],
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
  protected readonly isUrgent = isUrgent;
  protected readonly badTemplate = isBad('template-computation');
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
  // ❌ BAD (template-computation): a method per chip. This tile re-renders every second (its "no data for N s" age),
  // so every chip re-formats its text every second, Intl formatter included — though nothing changed.
  protected chipText(a: AlarmView): string {
    calc('chip text · method');
    return chipText(a);
  }

  /** Stale data that looks live is the most dangerous thing this screen could do. */
  readonly stale = computed(
    () => !this.bus.connected() || (this.ageSec() ?? 0) > STALE_AFTER_SEC,
  );
}
