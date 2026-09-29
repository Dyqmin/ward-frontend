import { tap, type MonoTypeOperatorFunction } from 'rxjs';

/**
 * R.6g · Logs "<label> <value>" for every value. Compared with ../trace.ts it shows neither
 * subscribe nor complete, error or teardown: you would not see a leak with it.
 */
export function simpleTrace<T>(label: string): MonoTypeOperatorFunction<T> {
  return tap((value) => console.log(label, value));
}
