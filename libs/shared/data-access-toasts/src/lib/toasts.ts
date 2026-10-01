import { Service, signal } from '@angular/core';

export type ToastKind = 'info' | 'success' | 'warn' | 'error';
export interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
}

@Service()
export class Toasts {
  private nextId = 1;
  private readonly _items = signal<readonly Toast[]>([]);
  readonly items = this._items.asReadonly();

  show(text: string, kind: ToastKind = 'info', ms = 5000): void {
    const toast: Toast = { id: this.nextId++, text, kind };
    this._items.update((all) => [...all.slice(-4), toast]);
    setTimeout(() => this.dismiss(toast.id), ms);
  }

  dismiss(id: number): void {
    this._items.update((all) => all.filter((t) => t.id !== id));
  }
}
