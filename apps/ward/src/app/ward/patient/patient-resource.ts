import { computed, inject, resource } from '@angular/core';
import { RedirectCommand, ResourceContext, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MessageBus, isPatientId } from '@core/messaging/contract';

/** Blocking: the page opens with a plain Patient. An unknown id redirects to /ward. */
export function patientByIdResource(ctx: ResourceContext) {
  const bus = inject(MessageBus); // in the factory: the loader runs outside the injection context
  const router = inject(Router);
  return resource({
    params: computed(() => {
      const id = String(ctx.params()['patientId'] ?? '');
      return isPatientId(id) ? id : undefined; // the guard ran, but it narrows nothing here
    }),
    loader: async ({ params: id }) => {
      const patient = await firstValueFrom(
        bus.request('/app/patients.byId', { id }),
      );
      if (!patient) throw new RedirectCommand(router.parseUrl('/ward'));
      return patient; // Patient – null is gone
    },
  });
}
