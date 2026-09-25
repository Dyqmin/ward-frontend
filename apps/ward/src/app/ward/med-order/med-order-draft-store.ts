import { Service, computed, signal } from '@angular/core';

import type { MedOrderDraft } from '@core/messaging/contract';

export type WizardStep = 'patient' | 'drug' | 'review';

/** What each step must fill in. A typo ('dose' instead of 'doseMg') is a compile error. */
const REQUIRED = {
  patient: ['patientId'],
  drug: ['drug', 'doseMg', 'route'],
} as const satisfies Record<
  'patient' | 'drug',
  readonly (keyof MedOrderDraft)[]
>;

/**
 * One draft per wizard. `autoProvided: false`: NOT in the root injector — it is provided on the
 * 'meds/new' route, so each wizard gets its own draft, destroyed with the route injector on exit.
 * (As a root service, a half-filled ICU-3 order would be waiting when the doctor opens ER-1.)
 */
@Service({ autoProvided: false })
export class MedOrderDraftStore {
  private readonly _draft = signal<Partial<MedOrderDraft>>({});
  private readonly _saved = signal(false);

  readonly draft = this._draft.asReadonly();
  /** Typed into, and not submitted yet. */
  readonly dirty = computed(
    () =>
      !this._saved() &&
      Object.values(this._draft()).some((v) => v !== undefined && v !== ''),
  );

  patch(change: Partial<MedOrderDraft>): void {
    this._draft.update((d) => ({ ...d, ...change }));
    this._saved.set(false);
  }

  isDone(step: keyof typeof REQUIRED): boolean {
    const d = this.draft();
    return REQUIRED[step].every((k) => d[k] !== undefined && d[k] !== '');
  }

  /** The full draft, once every step is done. */
  complete(): MedOrderDraft | null {
    const { patientId, drug, doseMg, route } = this.draft();
    return patientId && drug && doseMg !== undefined && route
      ? { patientId, drug, doseMg, route }
      : null;
  }

  markSaved(): void {
    this._saved.set(true);
  }
}
