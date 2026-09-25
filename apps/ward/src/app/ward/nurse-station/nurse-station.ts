import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { WARDS, bedsOf, isWardName, type Ward } from '@core/messaging/contract';
import { AlarmsStore } from '../data/alarms-store';
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
  private readonly allAlarms = toSignal(inject(AlarmsStore).all$(), {
    initialValue: [],
  });

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
  protected readonly urgentCount = computed(
    () => this.alarms().filter(isUrgent).length,
  );

  protected bedsOf = bedsOf;
  protected readonly alarmsFor = computed(() => alarmsByBed(this.allAlarms()));
}
