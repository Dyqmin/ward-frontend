import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, RedirectCommand, Router } from '@angular/router';

import { link } from '@core/messaging/contract';
import { MedOrderDraftStore } from './med-order-draft-store';
import type MedOrderWizard from './med-order-wizard';

/** A step opens only when the previous one is done; otherwise back to that step. */
export const stepCompleted =
  (step: 'patient' | 'drug'): CanActivateFn =>
  (route) =>
    inject(MedOrderDraftStore).isDone(step) ||
    new RedirectCommand(
      // paramsInheritanceStrategy 'always' (v22 default): the child sees the parent's :bed
      inject(Router).parseUrl('/' + link('ward/:bed/meds/new/:step', { bed: route.params['bed'], step })),
      //                                 ↑ forget a param and it doesn't compile
    );

export const unsavedDraftGuard: CanDeactivateFn<MedOrderWizard> = (wizard) =>
  !wizard.store.dirty() || confirm('Discard this medication order?');
