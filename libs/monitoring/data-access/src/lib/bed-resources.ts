import { computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ResourceContext } from '@angular/router';

import { MessageBus } from '@wm/shared/data-access-messaging';
import { bedFromSlug } from '@wm/shared/domain';

import { snapshotThenStream } from './snapshot-then-stream';

/** The bed from the URL. `validBed` already ran, so null only happens mid-navigation. */
const bedOf = (ctx: ResourceContext) =>
  computed(() => bedFromSlug(String(ctx.params()['bed'] ?? '')) ?? undefined);

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
