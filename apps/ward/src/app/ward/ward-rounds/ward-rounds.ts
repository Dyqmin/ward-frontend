import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { WARDS, bedsOf, toSlug } from '@core/messaging/contract';
import { AlarmsStore } from '../data/alarms-store';
import { PatientsStore } from '../data/patients-store';
import { AlarmActions } from '../ui/alarm-actions';
import { BedTile } from '../ui/bed-tile';
import { alarmsByBed } from '../ui/format';

/** The doctor's view of the same URL: escalations first, and the way into the medication wizard. */
@Component({
  selector: 'app-ward-rounds',
  imports: [RouterLink, BedTile, AlarmActions],
  template: `
    <section class="page">
      <h1>Ward rounds</h1>

      <section class="card escalations">
        <h2>Escalated to doctor</h2>
        @for (a of escalated(); track a.event.alarmId) {
          <app-alarm-actions [alarm]="a" />
        } @empty {
          <p class="muted">Nothing escalated. Nurses acknowledge alarms within 20 s, or they come here.</p>
        }
      </section>

      @for (w of wards; track w) {
        <h2 class="ward-title">{{ w }}</h2>
        <div class="grid">
          @for (bed of bedsOf(w); track bed) {
            @let patient = patients.patient(bed);
            <div class="slot">
              <app-bed-tile [bed]="bed" [patient]="patient" [alarms]="alarmsFor()(bed)" />
              @if (patient) {
                <a class="button small" [routerLink]="['/ward', slug(bed), 'meds', 'new']">Order medication</a>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .escalations {
      display: grid;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    .ward-title {
      margin-top: 1.25rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
      gap: 0.75rem;
    }
    .slot {
      display: grid;
      gap: 0.4rem;
      align-content: start;
    }
  `,
})
export default class WardRounds {
  protected readonly patients = inject(PatientsStore);
  private readonly alarms = toSignal(inject(AlarmsStore).all$(), { initialValue: [] });

  protected readonly wards = WARDS;
  protected readonly escalated = computed(() => this.alarms().filter((a) => a.event.status === 'escalated'));
  protected readonly bedsOf = bedsOf;
  protected readonly slug = toSlug;
  protected readonly alarmsFor = computed(() => alarmsByBed(this.alarms()));
}
