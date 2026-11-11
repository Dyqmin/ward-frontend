import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Clock } from '@core/clock';
import {
  WARDS,
  bedsOf,
  isWardName,
  type BedId,
  type Ward,
} from '@core/messaging/contract';
import { PERF, isBad } from '@perf/perf-modes';
import { calc } from '@perf/perf-stats';
import { AlarmsStore, type AlarmView } from '../data/alarms-store';
import { PatientsStore } from '../data/patients-store';
import { AlarmActions } from '../ui/alarm-actions';
import { BedTile } from '../ui/bed-tile';
import { alarmsByBed, isUrgent } from '../ui/format';

/** The nurse station: every bed, live, with the alarms to act on. */
@Component({
  selector: 'app-nurse-station',
  imports: [RouterLink, BedTile, AlarmActions],
  templateUrl: './nurse-station.html',
  styleUrl: './nurse-station.scss',
})
export default class NurseStation {
  /** `?ward=ICU` filter, bound by withComponentInputBinding(). */
  readonly ward = input<string>();
  /** `?empty=ICU-6` — set by the bed-detail loader when it redirects away from an empty bed. */
  readonly empty = input<string>();

  protected readonly patients = inject(PatientsStore);
  protected readonly allAlarms = toSignal(inject(AlarmsStore).all$(), {
    initialValue: [],
  });
  private readonly now = inject(Clock).now;

  protected readonly bad = {
    template: isBad('template-computation'),
    track: isBad('for-track'),
  };
  /** Performance · stress: every ward N times (⚡ Perf → Stress), so costs become measurable. */
  protected readonly copies = Array.from({ length: PERF.stress }, (_, i) => i);

  /** The page re-renders every second because of this — which is fine, if the children don't. */
  protected readonly shiftClock = computed(() =>
    new Date(this.now()).toLocaleTimeString(),
  );

  protected readonly wards = WARDS;
  protected readonly selected = computed<Ward | null>(() => {
    const w = this.ward()?.toUpperCase() ?? '';
    return isWardName(w) ? w : null;
  });
  protected readonly visibleWards = computed(() =>
    this.selected() ? [this.selected() as Ward] : WARDS,
  );
  protected readonly alarms = computed(() =>
    this.allAlarms()
      .filter((a) =>
        this.visibleWards().some((w) => a.event.bed.startsWith(`${w}-`)),
      )
      .sort((a, b) => Number(isUrgent(b)) - Number(isUrgent(a))),
  );
  // ✅ GOOD (template-computation): computed() filters once per alarm change. A check only reads the cached number.
  protected readonly urgentCount = computed(() => {
    calc('urgentCount · computed');
    return this.alarms().filter(isUrgent).length;
  });

  // ❌ BAD (template-computation): a getter is a method in disguise. Read twice in the template, on every check
  // (every second, for the shift clock): two full filters per second, for a number that didn't change.
  protected get urgentNow(): number {
    calc('urgentNow · getter');
    return this.alarms().filter(isUrgent).length;
  }

  // ✅ GOOD (template-computation): alarms per ward, counted once per alarm change.
  protected readonly alarmsPerWard = computed(() => {
    calc('alarmsPerWard · computed');
    const count = new Map<string, number>();
    for (const a of this.allAlarms()) {
      const w = a.event.bed.split('-')[0];
      count.set(w, (count.get(w) ?? 0) + 1);
    }
    return count;
  });

  protected bedsOf = bedsOf;

  // ✅ GOOD (template-computation): computed once per alarm change; every tile gets the SAME array until its alarms change.
  protected readonly alarmsFor = computed(() => {
    calc('alarmsFor · computed');
    return alarmsByBed(this.allAlarms());
  });

  // ❌ BAD (template-computation): runs for every tile on every check of this page, and returns a NEW array each time.
  // A new array is a new input value → every tile is marked dirty and re-renders, every second.
  protected alarmsOf(bed: BedId): readonly AlarmView[] {
    calc('alarmsOf · method');
    return this.allAlarms().filter((a) => a.event.bed === bed);
  }

  // ❌ BAD (for-track): fresh objects for "immutability" (or straight from JSON.parse). With `track a`,
  // no item is ever the same item: every change destroys and re-creates every row.
  protected readonly alarmsCopied = computed(() =>
    this.alarms().map((a) => ({ ...a })),
  );
}
