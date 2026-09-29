import { computed, inject, resource } from '@angular/core';
import { RedirectCommand, ResourceContext, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  MessageBus,
  bedFromSlug,
  isMedOrderId,
  link,
  toSlug,
} from '@core/messaging/contract';

/** Blocking: the order in the URL, if it exists and belongs to the patient in this bed; otherwise back to the bed. */
export function medOrderResource(ctx: ResourceContext) {
  const bus = inject(MessageBus);
  const router = inject(Router);
  return resource({
    params: computed(() => {
      const id = String(ctx.params()['orderId'] ?? '');
      const bed = bedFromSlug(String(ctx.params()['bed'] ?? ''));
      return isMedOrderId(id) && bed ? { id, bed } : undefined;
    }),
    loader: async ({ params: { id, bed } }) => {
      const [order, patient] = await Promise.all([
        firstValueFrom(bus.request('/app/medication.get', { id })),
        firstValueFrom(bus.request('/app/patients.get', { bed })),
      ]);
      // an order belongs to a patient, the URL names a bed: ICU-3 must not show an ER-2 order
      if (!order || !patient || order.patientId !== patient.id)
        throw new RedirectCommand(
          router.parseUrl('/' + link('ward/:bed', { bed: toSlug(bed) })),
        );
      return order;
    },
  });
}
