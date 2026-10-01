import { Component, input } from '@angular/core';

/** The title row of a page. Anything inside it (buttons, filters) goes to the right. */
@Component({
  selector: 'wm-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly subtitle = input<string>();
}
