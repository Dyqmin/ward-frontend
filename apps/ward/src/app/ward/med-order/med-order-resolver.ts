import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  MessageBus,
  bedFromSlug,
  isMedOrderId,
  link,
  type MedOrder,
} from '@core/messaging/contract';

/** The order in the URL, if it exists and belongs to the patient in this bed; otherwise back to the bed. */
export const medOrderResolver: ResolveFn<MedOrder> = async (route) => {
  const bus = inject(MessageBus);
  const router = inject(Router);
  const toBed = new RedirectCommand(
    router.parseUrl('/' + link('ward/:bed', { bed: route.params['bed'] })),
  );

  const id = route.params['orderId'] ?? '';
  const bed = bedFromSlug(route.params['bed'] ?? '');
  if (!isMedOrderId(id) || !bed) return toBed;

  const [order, patient] = await Promise.all([
    firstValueFrom(bus.request('/app/medication.get', { id })),
    firstValueFrom(bus.request('/app/patients.get', { bed })),
  ]);
  // an order belongs to a patient, the URL names a bed: ICU-3 must not show an ER-2 order
  if (!order || !patient || order.patientId !== patient.id) return toBed;
  return order;
};
