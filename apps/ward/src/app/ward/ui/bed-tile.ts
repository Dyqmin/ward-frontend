import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { map } from 'rxjs';

import { Clock } from '@core/clock';
import { MessageBus, toSlug, type BedId, type Patient } from '@core/messaging/contract';
import type { AlarmView } from '../data/alarms-store';
import { alarmTitle, isUrgent } from './format';
import { VitalValue } from './vital-value';

/** Frames normally arrive every second; older than this and the tile says so. */
export const STALE_AFTER_SEC = 3;

@Component({
  selector: 'app-bed-tile',
  imports: [RouterLink, VitalValue, NgxSkeletonLoaderComponent],
  template: `
    <a class="tile" [routerLink]="['/ward', slug()]" [class.alarm]="urgent()" [class.stale]="stale()" [class.empty]="patient() === null">
      <header>
        <h3>{{ bed() }}</h3>
        <span class="name">
          @switch (patient()) {
            @case (undefined) {
              …
            }
            @case (null) {
              Empty bed
            }
            @default {
              {{ patient()?.name }}
            }
          }
        </span>
      </header>

      @if (vitals.hasValue()) {
        @let v = vitals.value().frame;
        <div class="vitals">
          <app-vital-value label="HR" vital="hr" [value]="v.hr" unit="bpm" [stale]="stale()" />
          <app-vital-value label="SpO₂" vital="spo2" [value]="v.spo2" unit="%" [stale]="stale()" />
          <app-vital-value label="RR" vital="rr" [value]="v.rr" unit="/min" [stale]="stale()" />
        </div>
        <footer class="row">
          @if (stale()) {
            <span class="chip warn">no data for {{ ageSec() }} s</span>
          } @else {
            <span class="chip ok">live</span>
          }
          @for (a of alarms(); track a.event.alarmId) {
            <span class="chip" [class.bad]="isUrgent(a)">{{ alarmTitle(a) }} · {{ a.event.status }}</span>
          }
        </footer>
      } @else {
        <ngx-skeleton-loader count="3" />
      }
    </a>
  `,
  styles: `
    .tile {
      display: grid;
      gap: 0.6rem;
      padding: 0.8rem 0.9rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card);
      color: inherit;
      text-decoration: none;
      min-height: 9.5rem;
      transition: border-color 0.2s;
    }
    .tile:hover {
      border-color: var(--accent);
    }
    .tile.alarm {
      border-color: var(--bad);
      box-shadow: 0 0 0 1px var(--bad) inset;
    }
    .tile.stale {
      border-style: dashed;
    }
    .tile.empty {
      opacity: 0.6;
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      align-items: baseline;
    }
    h3 {
      margin: 0;
    }
    .name {
      color: var(--muted);
      font-size: 0.85rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .vitals {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
  `,
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

  /**
   * The vitals type comes from watch() itself (PayloadOf), with no <VitalsFrame>. Age is measured
   * from when the frame ARRIVED, so a skewed server clock can't make old data look live.
   */
  readonly vitals = rxResource({
    params: () => this.bed(),
    stream: ({ params: bed }) => this.bus.watch(`/topic/vitals.${bed}`).pipe(map((frame) => ({ frame, at: Date.now() }))),
  });

  readonly ageSec = computed(() =>
    this.vitals.hasValue() ? Math.max(0, Math.round((this.now() - this.vitals.value().at) / 1000)) : null,
  );
  /** Stale data that looks live is the most dangerous thing this screen could do. */
  readonly stale = computed(() => !this.bus.connected() || (this.ageSec() ?? 0) > STALE_AFTER_SEC);
}
