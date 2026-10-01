import { Component, ElementRef, input, model, viewChild } from '@angular/core';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';

import type { AlarmView } from '@wm/monitoring/data-access';
import { alarmTitle, isUrgent } from '@wm/monitoring/ui';
import type { VitalsFrame } from '@wm/shared/domain';

import { VitalReading } from '../vital-reading/vital-reading';

/** The presentational half: shows what it is given, reports clicks. Injects nothing. */
@Component({
  selector: 'app-vitals-panel',
  imports: [NgxSkeletonLoaderComponent, VitalReading],
  templateUrl: './vitals-panel.html',
  styleUrl: './vitals-panel.scss',
})
export class VitalsPanel {
  readonly frame = input.required<VitalsFrame | undefined>();
  readonly stale = input(false);
  readonly ageSec = input<number | null>(null);
  readonly alarms = input<readonly AlarmView[]>([]);
  readonly paused = model(false);

  protected readonly alarmTitle = alarmTitle;
  protected readonly isUrgent = isUrgent;

  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');

  protected fullscreen(): void {
    void this.card().nativeElement.requestFullscreen();
  }
}
