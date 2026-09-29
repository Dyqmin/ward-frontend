import { inject } from '@angular/core';
import {
  CanActivateFn,
  CanDeactivateFn,
  RedirectCommand,
  Router,
} from '@angular/router';

import {
  bedFromSlug,
  isMedOrderId,
  isPatientId,
  link,
} from '@core/messaging/contract';

/** Yesterday's `bedFromSlug` at the URL boundary: 'icu-3' → 'ICU-3' ✅, 'icu-9' → null → back to /ward. */
export const validBed: CanActivateFn = (route) =>
  bedFromSlug(route.params['bed'] ?? '') !== null ||
  new RedirectCommand(inject(Router).parseUrl('/ward'));

/** The URL's shape only: 'pat_…'. Whether this patient exists is the resolver's job. */
export const validPatientId: CanActivateFn = (route) =>
  isPatientId(route.params['patientId'] ?? '') ||
  new RedirectCommand(inject(Router).parseUrl('/ward'));

/** The URL's shape only: 'med_…'. A bad id goes back to the bed, not to /ward. */
export const validMedOrderId: CanActivateFn = (route) =>
  isMedOrderId(route.params['orderId'] ?? '') ||
  new RedirectCommand(
    inject(Router).parseUrl(
      '/' + link('ward/:bed', { bed: route.params['bed'] }),
    ),
  );

/**
 * LAB TASK 2 · ask before leaving the form with a typed but unsent value.
 * `form` is the routed component. Nothing typed (form.dirty() is false) → return true, the nurse
 * may leave. Otherwise return the answer of confirm('Discard the value you typed but did not save?').
 * Typed structurally ({ dirty(): boolean }), so this file never imports the form component.
 */
export const unsentValueGuard: CanDeactivateFn<{ dirty(): boolean }> = (form) =>
  true;
