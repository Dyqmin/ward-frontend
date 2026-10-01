import { Component, inject } from '@angular/core';

import { Toasts } from '@wm/shared/data-access-toasts';

@Component({
  selector: 'app-toast-outlet',
  templateUrl: './toast-outlet.html',
  styleUrl: './toast-outlet.scss',
})
export class ToastOutlet {
  protected readonly toasts = inject(Toasts);
}
