import { Component, inject } from '@angular/core';
import { Toasts } from './toasts';

@Component({
  selector: 'app-toast-outlet',
  templateUrl: './toast-outlet.html',
  styleUrl: './toast-outlet.scss',
})
export class ToastOutlet {
  protected readonly toasts = inject(Toasts);
}
