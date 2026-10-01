import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import type { AlarmView } from '@wm/monitoring/domain';
import { MessageBus } from '@wm/shared/data-access-messaging';
import { Toasts } from '@wm/shared/data-access-toasts';
import type { BedId, VitalsFrame } from '@wm/shared/domain';

import { liveness } from '../liveness';
import { VitalsPanel } from '../vitals-panel/vitals-panel';

/** The smart half: gets the data, owns the state, decides. VitalsPanel shows it. */
@Component({
  selector: 'app-vitals-card',
  imports: [VitalsPanel],
  templateUrl: './vitals-card.html',
  styleUrl: './vitals-card.scss',
})
export class VitalsCard {
  /** Which bed to show; the bed screen passes it. */
  readonly bed = input.required<BedId>();
  readonly alarms = input<readonly AlarmView[]>([]);
  readonly paused = model(false);

  private readonly bus = inject(MessageBus);
  private readonly toasts = inject(Toasts);

  protected readonly vitals = rxResource({
    params: () => this.bed(),
    stream: ({ params: bed }) =>
      this.bus
        .watch(`/topic/vitals.${bed}`)
        .pipe(map((frame) => ({ frame, at: Date.now() }))),
  });

  private readonly live = liveness(
    computed(() =>
      this.vitals.hasValue() ? this.vitals.value().at : undefined,
    ),
  );
  protected readonly ageSec = this.live.ageSec;
  protected readonly stale = this.live.stale;

  protected readonly shown = linkedSignal<
    { frame: VitalsFrame | undefined; paused: boolean },
    VitalsFrame | undefined
  >({
    source: () => ({
      frame: this.vitals.hasValue() ? this.vitals.value().frame : undefined,
      paused: this.paused(),
    }),
    computation: (source, previous) =>
      source.paused && previous?.value ? previous.value : source.frame,
  });

  constructor() {
    effect(() => {
      if (!this.stale()) return;
      untracked(() =>
        this.toasts.show(`${this.bed()}: no live vitals`, 'warn'),
      );
    });
  }
}
