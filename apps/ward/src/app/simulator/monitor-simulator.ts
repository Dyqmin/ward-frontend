import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, Subject, map, of, switchMap, throttleTime } from 'rxjs';

import { AuthStore } from '@core/auth/auth-store';
import { ALL_BEDS, MessageBus, bedFromSlug, isOutOfRange, toSlug, type BedId } from '@core/messaging/contract';
import { STOMP_MODE } from '@core/messaging/stomp-mode';
import { ConnectionBadge } from '@core/ui/connection-badge';

/**
 * The room game: a participant's phone becomes the bedside monitor of one bed. The instructor
 * assigns beds (a GameNotice on /queue/game.{me}); in mock mode any bed can be picked.
 */
@Component({
  selector: 'app-monitor-simulator',
  imports: [RouterLink, ConnectionBadge],
  template: `
    <section class="phone">
      <header class="row">
        <strong>Bedside monitor</strong>
        <span class="spacer"></span>
        <app-connection-badge />
      </header>

      @if (monitored(); as b) {
        <h1>{{ b }}</h1>
        <div class="live" [class.alarm]="alarming()">
          <span class="label">live HR</span>
          <span class="hr">{{ liveHr() ?? '--' }}</span>
        </div>

        <label class="slider">
          <span>Heart rate: <strong>{{ target() }}</strong> bpm</span>
          <input type="range" min="30" max="200" [value]="target()" (input)="move($event)" />
        </label>
        <p class="muted">Push it past 130 and an alarm fires on the nurse station.</p>
        @if (refusal(); as r) {
          <p class="error-text">{{ r }}</p>
        }
      } @else {
        <h1>Waiting…</h1>
        <p class="muted">The instructor will make your phone the monitor for one bed.</p>
      }

      @if (mock) {
        <label>
          Bed (mock mode)
          <select (change)="pick($event)">
            <option value="" [selected]="!monitored()">–</option>
            @for (b of beds; track b) {
              <option [value]="b" [selected]="monitored() === b">{{ b }}</option>
            }
          </select>
        </label>
      }
      <a class="muted" routerLink="/ward">Open the ward</a>
    </section>
  `,
  styles: `
    .phone {
      max-width: 26rem;
      margin: 0 auto;
      padding: 1rem;
      display: grid;
      gap: 1rem;
    }
    h1 {
      font-size: 2.4rem;
      margin: 0;
    }
    .live {
      display: grid;
      justify-items: center;
      padding: 1rem;
      border-radius: var(--radius);
      background: var(--card);
      border: 1px solid var(--border);
    }
    .live.alarm {
      border-color: var(--bad);
      color: var(--bad);
      animation: pulse 1s infinite;
    }
    .label {
      color: var(--muted);
      font-size: 0.8rem;
    }
    .hr {
      font-size: 4.5rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .slider input {
      width: 100%;
      height: 2.5rem;
      accent-color: var(--accent);
    }
  `,
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

  protected readonly target = linkedSignal({ source: this.monitored, computation: () => 72 });
  protected readonly refusal = linkedSignal<BedId | null, string | null>({ source: this.monitored, computation: () => null });

  private readonly vitals = rxResource({
    params: () => this.monitored() ?? undefined,
    stream: ({ params: bed }) => this.bus.watch(`/topic/vitals.${bed}`),
  });
  protected readonly liveHr = computed(() => (this.vitals.hasValue() ? this.vitals.value()?.hr : undefined));
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
          return bed ? this.bus.send('/app/monitor.set', { bed, hr }) : of(null);
        }),
        map((r) => (r && r.status === 'forbidden' ? r.reason : null)),
        takeUntilDestroyed(),
      )
      .subscribe({ next: (reason) => this.refusal.set(reason), error: () => this.refusal.set('Broker unreachable') });

    // keep the URL in step with the assigned bed, so a reload lands on the same monitor
    effect(() => {
      const bed = this.monitored();
      if (bed && bedFromSlug(this.bed() ?? '') !== bed) void this.router.navigate(['/monitor', toSlug(bed)], { replaceUrl: true });
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
