import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { bedsOf, toSlug, WARDS } from '@wm/shared/domain';
import { Card, EmptyState, PageHeader } from '@wm/shared/ui-design-system';

import { AlarmsStore } from '../data/alarms-store';
import { PatientsStore } from '../data/patients-store';
import { AlarmActions } from '../ui/alarm-actions/alarm-actions';
import { BedTile } from '../ui/bed-tile/bed-tile';
import { alarmsByBed } from '../ui/format';

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
