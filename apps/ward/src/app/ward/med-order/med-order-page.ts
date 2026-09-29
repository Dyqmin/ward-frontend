import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { link, type MedOrder } from '@core/messaging/contract';
import { clock, who } from '../ui/format';

@Component({
  selector: 'app-med-order-page',
  imports: [RouterLink],
  templateUrl: './med-order-page.html',
  styles: '.narrow { max-width: 28rem } .back { text-decoration: none }',
})
export default class MedOrderPage {
  /** From `resources: … ({ order: … })`, blocking: a plain MedOrder that belongs to this bed. */
  readonly order = input.required<MedOrder>();
  /** The `:bed` route param, e.g. 'icu-3': the order itself only knows its patient. */
  readonly bed = input.required<string>();

  protected readonly bedLink = computed(
    () => '/' + link('ward/:bed', { bed: this.bed() }),
  );
  protected readonly ordered = computed(
    () => `${who(this.order().orderedBy)}, ${clock(this.order().createdAt)}`,
  );
}
