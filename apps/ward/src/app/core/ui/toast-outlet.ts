import { Component, inject } from '@angular/core';
import { Toasts } from './toasts';

@Component({
  selector: 'app-toast-outlet',
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of toasts.items(); track t.id) {
        <button
          type="button"
          class="toast"
          [class]="t.kind"
          (click)="toasts.dismiss(t.id)"
        >
          {{ t.text }}
        </button>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      display: grid;
      gap: 0.5rem;
      z-index: 20;
      max-width: min(26rem, calc(100vw - 2rem));
    }
    .toast {
      text-align: left;
      border: 0;
      border-left: 4px solid var(--accent);
      border-radius: 6px;
      padding: 0.6rem 0.9rem;
      background: var(--card);
      color: var(--text);
      box-shadow: 0 6px 18px rgb(0 0 0 / 0.35);
      cursor: pointer;
    }
    .success {
      border-left-color: var(--ok);
    }
    .warn {
      border-left-color: var(--warn);
    }
    .error {
      border-left-color: var(--bad);
    }
  `,
})
export class ToastOutlet {
  protected readonly toasts = inject(Toasts);
}
