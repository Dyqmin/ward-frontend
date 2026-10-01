/** Every URL of the Ward Monitor app, with its params. */
export type AppPath =
  | 'login'
  | 'forbidden'
  | 'ward'
  | 'ward/:bed'
  | 'ward/:bed/temperature'
  | 'ward/:bed/meds/new'
  | 'ward/:bed/meds/new/:step'
  | 'reports/:kind/:bed'
  | 'monitor'
  | 'monitor/:bed';

type ParamNames<P extends string> = P extends `${infer Head}/${infer Tail}`
  ? ParamNames<Head> | ParamNames<Tail>
  : P extends `:${infer Name}`
    ? Name
    : never;

export type RouteParams<P extends string> = { [K in ParamNames<P>]: string };

/** `link('ward/:bed', { bed: 'icu-3' })` → 'ward/icu-3'. Forget a param and it doesn't compile. */
export function link<P extends AppPath>(
  path: P,
  ...[params]: [ParamNames<P>] extends [never] ? [] : [RouteParams<P>]
): string {
  const values: Record<string, string> = params ?? {};
  return path.replace(/:(\w+)/g, (_, name: string) =>
    encodeURIComponent(values[name] ?? ''),
  );
}
