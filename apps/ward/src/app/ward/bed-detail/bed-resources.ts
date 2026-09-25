import { computed, inject, resource } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RedirectCommand, ResourceContext, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MessageBus, bedFromSlug } from '@core/messaging/contract';
import { snapshotThenStream } from './snapshot-then-stream';

/** The bed from the URL. `validBed` already ran, so null only happens mid-navigation. */
const bedOf = (ctx: ResourceContext) => computed(() => bedFromSlug(String(ctx.params()['bed'] ?? '')) ?? undefined);

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
      if (!p) throw new RedirectCommand(router.createUrlTree(['/ward'], { queryParams: { empty: bed } }));
      return p; // Patient – null is gone
    },
  });
}

/** Non-blocking candidate: snapshot first, then the live stream. */
export function vitalsResource(ctx: ResourceContext) {
  const bus = inject(MessageBus);
  return rxResource({
    params: bedOf(ctx),
    stream: ({ params: bed }) => snapshotThenStream(bus, bed),
  });
}

/** Non-blocking candidate: the medication orders for the patient in this bed. */
export function medicationResource(ctx: ResourceContext) {
  const bus = inject(MessageBus);
  return rxResource({
    params: bedOf(ctx),
    stream: ({ params: bed }) => bus.request('/app/medication.list', { bed }),
  });
}

/** Non-blocking candidate: manually recorded temperatures, newest first. */
export function manualReadingsResource(ctx: ResourceContext) {
  const bus = inject(MessageBus);
  return rxResource({
    params: bedOf(ctx),
    stream: ({ params: bed }) => bus.request('/app/vitals.manual', { bed }),
  });
}
