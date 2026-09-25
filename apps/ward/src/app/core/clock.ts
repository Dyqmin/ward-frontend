import { Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, map } from 'rxjs';

/** One shared 1 Hz clock. Stale-data checks compare frame timestamps against it. */
@Service()
export class Clock {
  readonly now = toSignal(interval(1000).pipe(map(() => Date.now())), { initialValue: Date.now() });
}
