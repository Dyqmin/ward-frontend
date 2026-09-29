import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  MessageBus,
  isPatientId,
  type Patient,
} from '@core/messaging/contract';

/** The patient in the URL, loaded before the page opens; an unknown id goes back to /ward. */
export const patientByIdResolver: ResolveFn<Patient> = async (route) => {
  const bus = inject(MessageBus); // before any await: inject() only works synchronously
  const router = inject(Router);
  const toWard = new RedirectCommand(router.parseUrl('/ward'));

  const id = route.params['patientId'] ?? '';
  if (!isPatientId(id)) return toWard; // the guard ran, but it narrows nothing here

  const patient = await firstValueFrom(
    bus.request('/app/patients.byId', { id }),
  );
  return patient ?? toWard;
};
