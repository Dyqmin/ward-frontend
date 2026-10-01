import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import {
  rxResource,
  takeUntilDestroyed,
  toSignal,
} from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, map, of, Subject, switchMap, throttleTime } from 'rxjs';

import { AuthStore, STOMP_MODE } from '@wm/shared/data-access-auth';
import { MessageBus } from '@wm/shared/data-access-messaging';
import {
  ALL_BEDS,
  bedFromSlug,
  type BedId,
  isOutOfRange,
  toSlug,
} from '@wm/shared/domain';

import { ConnectionBadge } from '../core/ui/connection-badge/connection-badge';

/**
 * The room game: a participant's phone becomes the bedside monitor of one bed. The instructor
 * assigns beds (a GameNotice on /queue/game.{me}); in mock mode any bed can be picked.
 */
@Component({
  selector: 'app-monitor-simulator',
  imports: [RouterLink, ConnectionBadge],
  templateUrl: './monitor-simulator.html',
  styleUrl: './monitor-simulator.scss',
})
export default class MonitorSimulator {
  /** `/monitor/icu-3`: the bed from the QR code (always used in mock mode, a hint otherwise). */
  readonly bed = input<string>();

  private readonly bus = inject(MessageBus);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly mock = inject(STOMP_MODE) === 'mock';
  protected readonly beds = ALL_BEDS;

  /** Room-game notices: "your phone is now the monitor for ICU-3" / "round over". */
  private readonly notice = toSignal(this.noticesForMe());

  protected readonly monitored = linkedSignal<BedId | null>(() => {
    const n = this.notice();
    if (n) return n.kind === 'patient' ? n.bed : null;
    return bedFromSlug(this.bed() ?? '');
  });

  protected readonly target = linkedSignal({
    source: this.monitored,
    computation: () => 72,
  });
  protected readonly refusal = linkedSignal<BedId | null, string | null>({
    source: this.monitored,
    computation: () => null,
  });

  private readonly vitals = rxResource({
    params: () => this.monitored() ?? undefined,
    stream: ({ params: bed }) => this.bus.watch(`/topic/vitals.${bed}`),
  });
  protected readonly liveHr = computed(() =>
    this.vitals.hasValue() ? this.vitals.value()?.hr : undefined,
  );
  protected readonly alarming = computed(() => {
    const hr = this.liveHr();
    return hr !== undefined && isOutOfRange('hr', hr);
  });

  /** At most 4 monitor.set per second (leading + trailing), like the backend's own monitor page. */
  private readonly moves = new Subject<number>();

  constructor() {
    this.moves
      .pipe(
        throttleTime(250, undefined, { leading: true, trailing: true }),
        switchMap((hr) => {
          const bed = this.monitored();
          return bed
            ? this.bus.send('/app/monitor.set', { bed, hr })
            : of(null);
        }),
        map((r) => (r && r.status === 'forbidden' ? r.reason : null)),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (reason) => this.refusal.set(reason),
        error: () => this.refusal.set('Broker unreachable'),
      });

    // keep the URL in step with the assigned bed, so a reload lands on the same monitor
    effect(() => {
      const bed = this.monitored();
      if (bed && bedFromSlug(this.bed() ?? '') !== bed)
        void this.router.navigate(['/monitor', toSlug(bed)], {
          replaceUrl: true,
        });
    });
  }

  private noticesForMe() {
    const me = this.auth.participantId();
    return me ? this.bus.notices(me) : EMPTY;
  }

  protected move(e: Event): void {
    const hr = (e.target as HTMLInputElement).valueAsNumber;
    this.target.set(hr);
    this.moves.next(hr);
  }

  protected pick(e: Event): void {
    this.monitored.set(bedFromSlug((e.target as HTMLSelectElement).value));
  }
}
