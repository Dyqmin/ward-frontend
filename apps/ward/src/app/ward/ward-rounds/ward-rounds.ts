import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { AlarmsStore, PatientsStore } from '@wm/monitoring/data-access';
import { alarmsByBed } from '@wm/monitoring/domain';
import { BedTile } from '@wm/monitoring/ui';
import { bedsOf, toSlug, WARDS } from '@wm/shared/domain';
import { Card, EmptyState, PageHeader } from '@wm/shared/ui-design-system';

import { AlarmActions } from '../alarm-actions/alarm-actions';

/** The doctor's view of the same URL: escalations first, and the way into the medication wizard. */
@Component({
  selector: 'app-ward-rounds',
  imports: [RouterLink, BedTile, AlarmActions, Card, EmptyState, PageHeader],
  templateUrl: './ward-rounds.html',
  styleUrl: './ward-rounds.scss',
})
export default class WardRounds {
  protected readonly patients = inject(PatientsStore);
  private readonly alarms = toSignal(inject(AlarmsStore).all$(), {
    initialValue: [],
  });

  protected readonly wards = WARDS;
  protected readonly escalated = computed(() =>
    this.alarms().filter((a) => a.event.status === 'escalated'),
  );
  protected readonly bedsOf = bedsOf;
  protected readonly slug = toSlug;
  protected readonly alarmsFor = computed(() => alarmsByBed(this.alarms()));
}
