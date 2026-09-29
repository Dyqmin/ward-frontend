import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { link, toSlug, type Patient } from '@core/messaging/contract';
import { clock } from '../ui/format';

@Component({
  selector: 'app-patient-page',
  imports: [RouterLink],
  templateUrl: './patient-page.html',
  styles: '.narrow { max-width: 28rem } .back { text-decoration: none }',
})
export default class PatientPage {
  /** From `resources: … ({ patient: … })`, blocking: a plain Patient, never null. */
  readonly patient = input.required<Patient>();

  protected readonly bedLink = computed(
    () => '/' + link('ward/:bed', { bed: toSlug(this.patient().bed) }),
  );
  protected readonly admitted = computed(() =>
    clock(this.patient().admittedAt),
  );
}
