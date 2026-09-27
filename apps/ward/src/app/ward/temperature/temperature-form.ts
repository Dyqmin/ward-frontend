// ward/temperature/temperature-form.ts — the lab's form (Tasks 2–4).
// Instructions and "done when" checks: DAY1-ANGULAR-EXERCISE.md in the repo root.
// The template (temperature-form.html) is done; it reads and writes the signals below.

import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  MessageBus,
  assertNever,
  link,
  toSlug,
  type RpcResult,
} from '@core/messaging/contract';
import { commandRetry } from '@core/messaging/command-retry';
import { Toasts } from '@core/ui/toasts';
import { clock, who } from '../ui/format';

@Component({
  selector: 'app-temperature-form',
  imports: [RouterLink],
  templateUrl: './temperature-form.html',
  styleUrl: './temperature-form.scss',
})
export default class TemperatureForm {
  /** Blocking `patient` resource from the route: a plain Patient, never undefined. */
  readonly patient = input.required<RpcResult<'patients.get'>>();

  private readonly bus = inject(MessageBus);
  private readonly router = inject(Router);
  private readonly toasts = inject(Toasts);

  /** What the nurse typed, as text. */
  protected readonly value = signal('');
  /** Shows the "pending sync…" chip and disables Save. */
  protected readonly pending = signal(false);
  /** Shown under the input. */
  protected readonly error = signal<string | null>(null);
  protected readonly slug = computed(() => toSlug(this.patient().bed));
  /** Set it once the temperature is accepted, so leaving no longer asks. */
  private readonly saved = signal(false);

  // LAB TASK 2: true while something is typed (value() is not '') and not saved() yet.
  readonly dirty = computed(() => false);

  protected text(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected save(): void {
    const value = Number(this.value());
    if (!Number.isFinite(value)) return this.error.set('Enter a number');
    this.error.set(null);

    // LAB TASK 3: send the command and handle every reply.
    //   this.bus.send('/app/vitals.record', { bed: …, vital: …, value }), then subscribe and
    //   switch on the reply's status (ward/ui/alarm-actions.ts has the same shape):
    //     'accepted'  → this.saved.set(true), a toast (this.toasts.show(…, 'success')), then
    //                   this.router.navigateByUrl('/' + link('ward/:bed', { bed: this.slug() }))
    //     'forbidden' → this.error.set(r.reason)
    //     'conflict'  → this.error.set(`Recorded by ${who(r.by)} at ${clock(r.at)}`)
    //     default     → assertNever(r)
    //
    // LAB TASK 4: survive an outage.
    //   Before sending: this.pending.set(true).
    //   Between send() and subscribe(): .pipe(commandRetry(this.bus), finalize(() => this.pending.set(false)))
    //   In subscribe, next to `next`: error: () => this.error.set('Broker unreachable — not saved. Try again.')
  }
}
