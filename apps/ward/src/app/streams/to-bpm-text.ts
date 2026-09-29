import { map, type OperatorFunction } from 'rxjs';

/** R.6e · HR 72 → "HR 72 bpm". A custom operator is just a function that returns an operator. */
export function toBpmText(): OperatorFunction<number, string> {
  return map((hr) => `HR ${hr} bpm`);
}
