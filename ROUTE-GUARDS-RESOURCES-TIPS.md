# Cheat sheet: guards and route resources

Short patterns for `ROUTE-GUARDS-RESOURCES-EXERCISE.md`. Each one comes from code that already
works in this app, so you can open the original next to your file. Frontend paths are relative to
`apps/ward/src/app/`.

## Where to copy from

| You're writing | Copy the shape of | File |
| --- | --- | --- |
| A guard that redirects | `validBed`, `stepCompleted` | `ward/guards.ts`, `ward/med-order/guards.ts` |
| A blocking route resource | `patientResource()` | `ward/bed-detail/bed-resources.ts` |
| A route with a guard and a resource | the `':bed/temperature'` route | `ward/ward.routes.ts` |
| A title computed from the URL | `bedTitle` | `ward/ward.routes.ts` |
| A mock reply | `'/app/patients.get'` | `testing/ward-fixtures.ts` |
| A backend query | `case 'patients.get'` in `query()` | `ward-worker` · `src/room/ward-room.ts` |

## Imports

```ts
import { computed, inject, input, resource } from '@angular/core';
import {
  CanActivateFn,
  RedirectCommand,
  ResourceContext,
  Router,
  RouterLink,
} from '@angular/router';
import { firstValueFrom } from 'rxjs';

// every domain type and guard, plus MessageBus, link(), toSlug() and bedFromSlug()
import { MessageBus, bedFromSlug, isMedOrderId, link, toSlug, type MedOrder } from '@core/messaging/contract';
```

`@core/messaging/contract` re-exports all of `shared/contract.ts`. You never need a relative
import of `shared/contract`.

---

## Guards

**Shape: "allowed, or where to go instead".** Return `true`, or a `RedirectCommand`. The `||`
does both in one expression.

```ts
export const validThing: CanActivateFn = (route) =>
  isThingId(route.params['thingId'] ?? '') ||
  new RedirectCommand(inject(Router).parseUrl('/somewhere'));
```

- **Params are strings, maybe missing.** `route.params['x']` is `any`. `?? ''` keeps the guard from
  crashing on `undefined`.
- **The param name is the name in `path`.** `path: ':bed/meds/:orderId'` gives
  `route.params['bed']` and `route.params['orderId']`.
- **A redirect built from the URL** (the same trick as `stepCompleted`):
  ```ts
  inject(Router).parseUrl('/' + link('ward/:bed', { bed: route.params['bed'] }))
  ```
  `link()` returns a path *without* a leading `/`, so add one; `parseUrl` needs an absolute URL.
- **`canActivate` runs in order.** In `canActivate: [validBed, validMedOrderId]`, a bad bed
  redirects before the order id is even looked at.
- **`canMatch` or `canActivate`?** `canMatch: false` means "this route doesn't exist, try the next
  one" (roles). `canActivate` with a `RedirectCommand` means "this is the right route, but go
  elsewhere" (a bad id).

---

## Route resources

### The skeleton

```ts
export function thingResource(ctx: ResourceContext) {
  const bus = inject(MessageBus); // here, in the factory
  const router = inject(Router);
  return resource({
    params: computed(() => {
      const id = String(ctx.params()['thingId'] ?? '');
      return isThingId(id) ? id : undefined; // undefined → the resource stays idle
    }),
    loader: async ({ params: id }) => {
      const thing = await firstValueFrom(bus.request('/app/thing.get', { id }));
      if (!thing) throw new RedirectCommand(router.parseUrl('/somewhere'));
      return thing; // the null is gone from the type
    },
  });
}
```

### Rules of thumb

- **`inject()` only in the factory body.** The loader runs later, outside the injection context.
  Calling `inject()` there throws NG0203.
- **`ctx.params()` is a signal.** Read it inside `computed`, so the resource loads again when the
  URL changes.
- **`params` narrows the type.** Whatever `params` returns (minus `undefined`) is what the loader
  gets. Return `id` only after `isThingId(id)`, and the loader gets a `ThingId`, not a `string`.
- **Several params: return an object.**
  ```ts
  params: computed(() => {
    const id = String(ctx.params()['orderId'] ?? '');
    const bed = bedFromSlug(String(ctx.params()['bed'] ?? ''));
    return isMedOrderId(id) && bed ? { id, bed } : undefined;
  }),
  loader: async ({ params: { id, bed } }) => { /* … */ },
  ```
- **Blocking resources redirect by throwing.** Throw a `RedirectCommand` from the loader. Don't
  return it: a returned value becomes the page's data.

### Messaging

- **`bus.request()` returns an Observable.** `firstValueFrom(...)` turns it into a Promise you can
  `await`.
- **The destination is `/app/` + the RPC name.** The body and the reply are typed from
  `RpcContract`, so a wrong field doesn't compile:
  ```ts
  const order = await firstValueFrom(bus.request('/app/medication.get', { id }));
  //    ^? MedOrder | null
  ```
- **Two requests at once:**
  ```ts
  const [a, b] = await Promise.all([
    firstValueFrom(bus.request('/app/thing.get', { id })),
    firstValueFrom(bus.request('/app/patients.get', { bed })),
  ]);
  ```

### Slugs and bed ids

| Value | Example | Convert with |
| --- | --- | --- |
| URL slug | `'er-2'` | `bedFromSlug('er-2')` → `'ER-2'` or `null` |
| `BedId` | `'ER-2'` | `toSlug('ER-2')` → `'er-2'` |

`link('ward/:bed', …)` wants the **slug**. `patients.get` wants the **`BedId`**.

---

## Routes

```ts
{
  path: ':bed/things/:thingId',
  title: 'Thing',
  canActivate: [validBed, validThing],
  resources: (ctx) => ({ thing: thingResource(ctx) }), // key 'thing' → input 'thing'
  loadComponent: () => import('./thing/thing-page'),   // default export, so no .then()
},
```

- **Order matters.** The router takes the **first** route that matches. `:orderId` also matches
  the word `new`, so a `':bed/meds/:orderId'` route must come **after** both `':bed/meds/new'`
  routes.
- **`patients/:id` can't clash with `:bed`.** `:bed` matches exactly one segment, and
  `patients/pat_x` is two.

## Pages

```ts
readonly thing = input.required<Thing>(); // blocking resource: the plain value
readonly bed = input.required<string>();  // the :bed route param, also bound as an input
```

- **Input name = key in `resources`**, and **= param name** for URL params.
- **Blocking** (the default) binds `Thing`. **`nonBlocking(…)`** binds a `Resource<Thing | undefined>`,
  which you read with `thing.value()`, `thing.isLoading()` and so on.
- **Global CSS:** `.page`, `.muted`, `.chip`, `.button`. **Not global:** `.narrow`, `.back`. Add
  them in `styles:` if you use them.

## Links

```html
<!-- ✅ absolute, typed: a string -->
<a [routerLink]="'/' + link('ward/:bed', { bed: slug() })">…</a>

<!-- ✅ relative to the current route (the bed page): segments in an array -->
<a [routerLink]="['meds', o.id]">…</a>

<!-- ❌ the slashes in link()'s result get encoded: /ward%2Fer-2 -->
<a [routerLink]="['/', link('ward/:bed', { bed: slug() })]">…</a>
```

- **Templates can't see imports.** To call `link()` in a template, expose it:
  `protected readonly link = link;`.
- **`RouterLink` must be in the component's `imports`,** or the build fails with "Can't bind to
  'routerLink' since it isn't a known property of 'a'".
- **A new `AppPath` entry** (`core/messaging/contract.ts`) makes `link()` accept the path, and
  require every `:param` in it.

## Mock replies

```ts
// testing/ward-fixtures.ts · createWardFixtures() · replies
'/app/thing.get': ({ id }) => ward.things.get(id) ?? null,
```

- `ward.patients` is a `Map<BedId, Patient>` (search it by value for a patient id).
- `ward.orders` is a `Map<MedOrderId, MedOrder>`.
- A missing reply still compiles; it fails at runtime with "No fixture for /app/…".

## Backend (`ward-worker`)

```ts
// src/room/ward-room.ts · query()
case 'thing.get':
  if (!REQUEST_GUARDS[name](body)) throw invalid();
  return this.state.thing(body.id);

// src/room/ward-state.ts
thing(id: ThingId): Thing | null {
  const t = this.things.get(id);
  return t ? { ...t.value } : null; // a copy: callers can't change stored state
}
```

`REQUEST_GUARDS[name](body)` narrows `body`, so `body.id` is typed after the check.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `NG0203: inject() must be called from an injection context` | `inject()` inside the loader | Move it to the top of the factory |
| The page opens but the input is `undefined`, or "required input" error | Key in `resources` ≠ input name | Use the same name in both |
| Link goes to `/ward%2F…` and lands on `/ward` | `link()` inside a `routerLink` array | Pass a string: `'/' + link(…)` |
| "Can't bind to 'routerLink' since it isn't a known property of 'a'" | `RouterLink` missing from `imports` | Add it to the component's `imports` |
| "No fixture for /app/…" in the Dev log | Missing mock reply | Add it to `testing/ward-fixtures.ts` (step 3) |
| Socket drops (reconnecting) when the page opens | The backend doesn't know the RPC | Deploy the backend first |
| "Order medication" bounces a doctor back to the bed | `:bed/meds/:orderId` is above `meds/new` | Move it below both `meds/new` routes |
| `Argument of type 'string' is not assignable to 'MedOrderId'` | `id` wasn't narrowed | Return it from `params` only after `isMedOrderId(id)` |
| `link()` doesn't compile | Path not in `AppPath`, or a param missing | Add the path; pass every `:param` |
| `patients.get` doesn't compile with `'er-2'` | A slug where a `BedId` is expected | `bedFromSlug()` first |
| Nothing loads, and no request appears in the Dev log | `params` returned `undefined` | Check the param names against `path` |
| Another bed's order shows under this bed | No ownership check | Compare `order.patientId` with the bed's patient id |
