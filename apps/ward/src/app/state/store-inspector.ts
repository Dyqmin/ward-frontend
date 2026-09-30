import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActionsSubject, Store } from '@ngrx/store';

interface LoggedAction {
  n: number;
  type: string;
  /** The action's data without its type, as JSON; '' when it carries none. */
  payload: string;
  /** NgRx's own bookkeeping, e.g. "@ngrx/store/update-reducers". */
  internal: boolean;
}

/**
 * Ready-made: the last actions dispatched to the Store and the whole state after them.
 * The same two things Redux DevTools shows, without installing anything.
 */
@Component({
  selector: 'app-store-inspector',
  imports: [JsonPipe],
  templateUrl: './store-inspector.html',
  styleUrl: './store-inspector.scss',
})
export class StoreInspector {
  protected readonly state = inject(Store).selectSignal(
    (state: object) => state,
  );
  protected readonly actions = signal<readonly LoggedAction[]>([]);
  private count = 0;

  constructor() {
    inject(ActionsSubject)
      .pipe(takeUntilDestroyed())
      .subscribe(({ type, ...data }) => {
        const logged: LoggedAction = {
          n: ++this.count,
          type,
          payload: Object.keys(data).length ? JSON.stringify(data) : '',
          internal: type.startsWith('@ngrx/'),
        };
        this.actions.update((all) => [logged, ...all].slice(0, 8));
      });
  }
}
