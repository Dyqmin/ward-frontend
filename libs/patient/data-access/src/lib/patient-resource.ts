import { computed, inject, resource } from '@angular/core';
import { RedirectCommand, ResourceContext, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MessageBus } from '@wm/shared/data-access-messaging';
import { bedFromSlug } from '@wm/shared/domain';

/** The bed from the URL. `validBed` already ran, so null only happens mid-navigation. */
const bedOf = (ctx: ResourceContext) =>
  computed(() => bedFromSlug(String(ctx.params()['bed'] ?? '')) ?? undefined);

/**
 * Blocking: the record must exist before the page shows, and the input gets a plain `Patient`.
 * An empty bed (`null`) redirects to the ward. Shared by the bed detail and the temperature form.
 */
export function patientResource(ctx: ResourceContext) {
  const bus = inject(MessageBus);
  const router = inject(Router);
  return resource({
    params: bedOf(ctx),
    loader: async ({ params: bed }) => {
      const p = await firstValueFrom(bus.request('/app/patients.get', { bed }));
      if (!p)
        throw new RedirectCommand(
          router.createUrlTree(['/ward'], { queryParams: { empty: bed } }),
        );
      return p; // Patient – null is gone
    },
  });
}
