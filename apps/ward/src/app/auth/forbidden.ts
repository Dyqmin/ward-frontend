import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthStore } from '@core/auth/auth-store';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  template: `
    <section class="card">
      <h1>Not for your role</h1>
      <p>
        This screen is not available to a
        <strong>{{ auth.role() ?? 'guest' }}</strong
        >. Nurses record vitals and give medication; only doctors order
        medication.
      </p>
      <a class="button" routerLink="/ward">Back to the ward</a>
    </section>
  `,
  styles: `
    :host {
      display: block;
      max-width: 36rem;
      margin: 3rem auto;
      padding: 0 1rem;
    }
  `,
})
export default class Forbidden {
  protected readonly auth = inject(AuthStore);
}
