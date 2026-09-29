# Guards and route resources: detail routes by id

**Instructor demo: 25 minutes · Pairs exercise: 40 minutes + 10 minutes review**

The ward already has guards for roles (`hasRole`), for the bed in the URL (`validBed`), for wizard
steps (`stepCompleted`) and for leaving a form (`unsavedDraftGuard`). The bed page loads its data
with **route resources** (`resources:` in `ward.routes.ts`, factories in
`ward/bed-detail/bed-resources.ts`). In this lab you write both halves yourself for a new page: a
guard that checks the id in the URL, and a blocking route resource that loads one record before the
page opens, and redirects when that record doesn't exist.

Reference: [Data fetching with route resources](https://next.angular.dev/guide/routing/data-fetching-with-resources).

Both parts build the same feature, end to end, for two different records:

| | Part A · Instructor demo | Part B · Participant exercise |
| --- | --- | --- |
| URL | `/ward/patients/:patientId` | `/ward/:bed/meds/:orderId` |
| Linked from | The patient's name in the bed detail header | The drug name in each row of the bed's medication list |
| RPC | `patients.byId { id }` → `Patient \| null` | `medication.get { id }` → `MedOrder \| null` |
| Guard (`canActivate`) | `validPatientId`: a bad id → `/ward` | `validMedOrderId`: a bad id → `/ward/:bed` |
| Route resource (`resources`) | `patientByIdResource`: unknown patient → `/ward` | `medOrderResource`: unknown order, or another bed's order → `/ward/:bed` |

Every occupied bed has a patient and 1–2 medication orders. The server never deletes either, so a
link to one keeps working. The empty beds are ICU-6, ER-4 and CARD-3.

## The eight steps

Part B repeats Part A's steps with the same numbers, so **A*n* is the worked example for B*n***.
When you're stuck on B5, reread A5. `ROUTE-GUARDS-RESOURCES-TIPS.md` has snippets and a
troubleshooting table.

| Step | Where | What |
| --- | --- | --- |
| 1 | `ward-worker` | The backend answers the new RPC |
| 2 | `shared/contract.ts` | The frontend knows the RPC and its request guard |
| 3 | `testing/ward-fixtures.ts` | The mock ward answers it too (for `?mock`) |
| 4 | `core/messaging/contract.ts` | A type-safe link to the new page |
| 5 | `ward/guards.ts` | The guard: is the id in the URL well-formed? |
| 6 | a new resource file | The route resource: load the record, or redirect |
| 7 | a new page component | Render the loaded record |
| 8 | `ward/ward.routes.ts` + a template | The route, and a link that leads to it |

Frontend paths are relative to `apps/ward/src/app/`. Backend paths are relative to the
`ward-worker` repo.

## Getting started

```sh
pnpm install
pnpm start          # http://localhost:4200/ward
```

The app talks to the deployed `ward-worker` instance. Add `?mock` to the URL to use the in-memory
ward from step 3 instead; `?mock=0` switches back. In mock mode, the Dev toolbar at the bottom left
lists every request, which is how you check that a guard stopped a navigation before any request
went out.

**Deploy order.** The backend **closes the socket** when it gets an RPC name it doesn't know. An
old frontend works with the new backend, but a new frontend on an old backend loses its connection
as soon as it opens one of these pages. Always ship the backend first.

---

## Part A · Instructor demo: the patient page

### A1 · Backend: answer `patients.byId`

1. **`src/shared/contract.ts`:** in `RpcContract`, under `// queries`:
   ```ts
   'patients.byId':    { req: { id: PatientId };                                          res: Patient | null };
   ```
   Run `npm run typecheck`. **`REQUEST_GUARDS` stops compiling**: it's a mapped type over every
   RPC name, so a new RPC must come with its request guard. Add it after `'alarms.active'`:
   ```ts
   'patients.byId': (x): x is RpcContract['patients.byId']['req'] =>
     isObj(x) && typeof x.id === 'string' && isPatientId(x.id),
   ```
2. **`src/room/ward-room.ts`:** now `IS_COMMAND` stops compiling. Every RPC must say whether it's
   a command. Add `'patients.byId': false,`. Then add a `case` at the end of the `switch` in
   `query()`:
   ```ts
   case 'patients.byId':
     if (!REQUEST_GUARDS[name](body)) throw invalid();
     return this.state.patientById(body.id);
   ```
3. **`src/room/ward-state.ts`:** next to `patient(bed)`. Patients are stored by bed, so search by
   id. Add `type PatientId` to the imports from `../shared/contract`.
   ```ts
   patientById(id: PatientId): Patient | null {
     return [...this.patients.values()].find((p) => p.id === id) ?? null;
   }
   ```
4. **`FRONTEND.md`:** add a row to the queries table.

**Done when** `npm run typecheck` is clean.

### A2 · Frontend contract (`shared/contract.ts`)

This is the frontend's own copy of the same file. Make the same two edits as in A1.1: the
`RpcContract` entry and the `REQUEST_GUARDS` entry. `npx tsc -p apps/ward/tsconfig.app.json --noEmit`
fails in the same way until both are there.

From now on, `bus.request('/app/patients.byId', { id })` type-checks, and its reply is
`Patient | null`.

### A3 · Mock (`testing/ward-fixtures.ts`)

In `createWardFixtures()`, under `// ---------- queries ----------`:

```ts
'/app/patients.byId': ({ id }) =>
  [...ward.patients.values()].find((p) => p.id === id) ?? null,
```

`replies` entries are optional, so leaving this out still compiles. It fails only at runtime:
"No fixture for /app/patients.byId" appears in the Dev toolbar's log.

### A4 · Type-safe link (`core/messaging/contract.ts`)

Add `'ward/patients/:patientId'` to the `AppPath` union. After that,
`link('ward/patients/:patientId', { patientId })` won't compile without its param.

### A5 · Guard (`ward/guards.ts`)

```ts
/** The URL's shape only: 'pat_…'. Whether this patient exists is the resource's job. */
export const validPatientId: CanActivateFn = (route) =>
  isPatientId(route.params['patientId'] ?? '') ||
  new RedirectCommand(inject(Router).parseUrl('/ward'));
```

Import `isPatientId` from `@core/messaging/contract`, which re-exports all of `shared/contract.ts`.

### A6 · Route resource (new file `ward/patient/patient-resource.ts`)

Model: `patientResource()` in `ward/bed-detail/bed-resources.ts`.

```ts
import { computed, inject, resource } from '@angular/core';
import { RedirectCommand, ResourceContext, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MessageBus, isPatientId } from '@core/messaging/contract';

/** Blocking: the page opens with a plain Patient. An unknown id redirects to /ward. */
export function patientByIdResource(ctx: ResourceContext) {
  const bus = inject(MessageBus); // ① in the factory, never in the loader
  const router = inject(Router);
  return resource({
    params: computed(() => {
      const id = String(ctx.params()['patientId'] ?? '');
      return isPatientId(id) ? id : undefined; // ② undefined: the resource stays idle
    }),
    loader: async ({ params: id }) => {
      const patient = await firstValueFrom(bus.request('/app/patients.byId', { id }));
      if (!patient) throw new RedirectCommand(router.parseUrl('/ward')); // ③
      return patient; // Patient – null is gone
    },
  });
}
```

Points to make while you write it:

- **① `inject()` belongs in the factory.** The router calls `patientByIdResource(ctx)` in an
  injection context; the loader runs later, outside it. Move `inject(Router)` into the loader once
  to show error NG0203.
- **② The guard doesn't narrow anything for the resource.** `ctx.params()` hands over the raw
  `string`, so the resource checks the id again. The check is cheap, and it's what gives `id` the
  type `PatientId`. Returning `undefined` from `params` keeps the resource idle instead of sending
  a bad request.
- **③ Redirect by throwing.** A blocking resource that throws a `RedirectCommand` cancels the
  navigation, so the page never opens with `null`. `patientResource()` does exactly this for an
  empty bed.
- **`params` is reactive.** Going from one patient to another changes `ctx.params()`, and the
  resource loads again. No `runGuardsAndResolvers` needed.

### A7 · Page (new files `ward/patient/patient-page.ts` and `.html`)

`withComponentInputBinding()` and `withRouterResources()` are already on, so the loaded value
arrives as an input. **Its name is the key in `resources`** (step 8). A blocking resource arrives
as the plain value (`Patient`), not as a `Resource<Patient>`. `.page`, `.muted` and `.chip` are global styles; `.narrow` and
`.back` are not, hence the two inline rules.

```ts
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { link, toSlug, type Patient } from '@core/messaging/contract';
import { clock } from '../ui/format';

@Component({
  selector: 'app-patient-page',
  imports: [RouterLink],
  templateUrl: './patient-page.html',
  styles: '.narrow { max-width: 28rem } .back { text-decoration: none }',
})
export default class PatientPage {
  /** From `resources: … ({ patient: … })`, blocking: a plain Patient, never null. */
  readonly patient = input.required<Patient>();

  protected readonly bedLink = computed(
    () => '/' + link('ward/:bed', { bed: toSlug(this.patient().bed) }),
  );
  protected readonly admitted = computed(() => clock(this.patient().admittedAt));
}
```

```html
<section class="page narrow">
  <a class="back" [routerLink]="bedLink()">← {{ patient().bed }}</a>
  <h1>{{ patient().name }}</h1>
  <p class="muted">Patient {{ patient().id }} · admitted {{ admitted() }}</p>
</section>
```

### A8 · Route and link

1. **`ward/ward.routes.ts`:** add this above the bed detail route (`path: ':bed'`):
   ```ts
   // patient page: a blocking route resource, loaded before the page opens
   {
     path: 'patients/:patientId',
     title: 'Patient',
     canActivate: [validPatientId],
     resources: (ctx) => ({ patient: patientByIdResource(ctx) }),
     loadComponent: () => import('./patient/patient-page'),
   },
   ```
   It can't clash with `':bed'`: that path matches exactly one segment, and this one has two.
2. **`ward/bed-detail/bed-detail.html`:** make the name in the `<h1>` a link. `RouterLink` is
   already imported there:
   ```html
   <h1>
     <a [routerLink]="'/' + link('ward/patients/:patientId', { patientId: patient().id })"
       >{{ patient().name }}</a
     >
     · {{ patient().bed }}
   </h1>
   ```
   In `bed-detail.ts`, add `link` to the imports from `@core/messaging/contract` and expose it to
   the template with `protected readonly link = link;`, next to `clock` and `who`.

   Pass a **string**, not `['/', link(…)]`. In an array, each item is one path segment, so the
   router encodes the slashes inside `link()`'s result (`/ward%2Fpatients%2F…`) and the link lands
   on `/ward`.

### Part A · Done when

| Check | Proves |
| --- | --- |
| Clicking the name on `/ward/icu-3` opens the patient page, with the name on first paint | blocking resource + input binding |
| `/ward/patients/hello` lands on `/ward`, and the Dev log shows no `patients.byId` request | the guard runs first |
| `/ward/patients/pat_nobody` lands on `/ward` after one `patients.byId` request | the resource redirects |
| The tab title reads "Patient · Ward Monitor" | `title` |

**Talking point: why not a classic resolver?** Before route resources, this was
`resolve: { patient: patientByIdResolver }` with a `ResolveFn<Patient>` that *returned* the
`RedirectCommand`. Route resources do the same job and more: resources on all matched routes load
concurrently (resolvers run one route at a time), a resource can be `nonBlocking()` so the page
opens at once with a loading state, and it reloads by itself when its params change. You'll still
meet `ResolveFn` in older code; the idea is the same.

---

## Part B · Exercise: the medication order page

Work in pairs. Each step says exactly what to write. Try it with the matching Part A step open
next to you; each step also has a solution you can unfold if you're stuck. Parts that differ from
Part A are marked **New**.

### B1 · Backend: answer `medication.get` (5 min)

Work in the `ward-worker` repo, on the `day3-routing` branch. Look for the two `LAB B1` comments.

**Already done for you:** `'medication.get'` is in `RpcContract`, in `REQUEST_GUARDS`
(`src/shared/contract.ts`) and in `IS_COMMAND` (`src/room/ward-room.ts`). Read those three entries
first; they match what you saw in A1. What's missing is the code that answers the request:

1. **`src/room/ward-room.ts`:** add a `case 'medication.get'` to the `switch` in `query()`. Validate
   the body with `REQUEST_GUARDS[name]` and return `this.state.medication(body.id)`.
2. **`src/room/ward-state.ts`:** add `medication(id: MedOrderId): MedOrder | null` next to
   `medications(bed)`. Orders are stored by id in `this.meds`, so no search is needed. **New:**
   each value is a `MedRecord`, so return a **copy** of its `.order` (`{ ...m.order }`), as
   `medications()` does. Then nobody can change the stored order through your reply.
3. **`FRONTEND.md`:** add a row to the queries table.

**Done when** both `LAB B1` comments are replaced and `npm run typecheck` is clean. The typecheck
alone passes before you start: `query()` doesn't have to handle every name, so a missing `case`
only shows up at runtime as an empty reply.

<details>
<summary>Solution</summary>

```ts
// src/room/ward-room.ts · query()
case 'medication.get':
  if (!REQUEST_GUARDS[name](body)) throw invalid();
  return this.state.medication(body.id);

// src/room/ward-state.ts
medication(id: MedOrderId): MedOrder | null {
  const m = this.meds.get(id);
  return m ? { ...m.order } : null;
}
```

</details>

### B2 · Frontend contract (already done)

**File:** `shared/contract.ts`

`'medication.get'` is already in `RpcContract` and `REQUEST_GUARDS`, so
`bus.request('/app/medication.get', { id })` type-checks and its reply is `MedOrder | null`. Find
the two entries and move on.

### B3 · Mock (2 min)

**File:** `testing/ward-fixtures.ts`, in `replies` under `// ---------- queries ----------`

Add `'/app/medication.get'`. It gets `{ id }` and returns the order, or `null`. `ward.orders` is
a `Map` keyed by order id.

<details>
<summary>Solution</summary>

```ts
'/app/medication.get': ({ id }) => ward.orders.get(id) ?? null,
```

</details>

### B4 · Type-safe link (1 min)

**File:** `core/messaging/contract.ts`

Add `'ward/:bed/meds/:orderId'` to `AppPath`. Now `link()` needs both `bed` and `orderId`.

### B5 · Guard (5 min)

**File:** `ward/guards.ts`

```ts
/** The URL's shape only: 'med_…'. A bad id goes back to the bed, not to /ward. */
export const validMedOrderId: CanActivateFn = (route) => /* TODO */;
```

1. Return `true` when `route.params['orderId']` passes `isMedOrderId`.
2. **New:** otherwise, redirect to **the bed**, not to `/ward`. Build the URL with
   `link('ward/:bed', { bed: route.params['bed'] })` and add a leading `/`. The medication wizard's
   `stepCompleted` in `ward/med-order/guards.ts` builds a redirect the same way.

<details>
<summary>Solution</summary>

```ts
export const validMedOrderId: CanActivateFn = (route) =>
  isMedOrderId(route.params['orderId'] ?? '') ||
  new RedirectCommand(
    inject(Router).parseUrl('/' + link('ward/:bed', { bed: route.params['bed'] })),
  );
```

Import `isMedOrderId` and `link` from `@core/messaging/contract`.

</details>

### B6 · Route resource (10 min)

**File:** new `ward/med-order/med-order-resource.ts`

```ts
export function medOrderResource(ctx: ResourceContext) {
  // 1. inject MessageBus and Router here, in the factory
  // 2. return resource({ params, loader })
  //    params: a computed that reads 'orderId' and 'bed' from ctx.params();
  //            { id, bed } when id is a MedOrderId and bedFromSlug(bed) isn't null, else undefined
  //    loader: request medication.get { id } AND patients.get { bed }, at the same time;
  //            no order, no patient, or order.patientId !== patient.id → throw a RedirectCommand
  //            to /ward/:bed; otherwise return the order
}
```

Step 1 and the redirect are A6 with other names. **New:**

- **Two params.** `params` returns an object, `{ id, bed }`. The loader receives it as
  `({ params: { id, bed } })`. `bed` is a `BedId` there (`'ER-2'`); for the redirect URL, turn it
  back into a slug with `toSlug(bed)`.
- **Two requests at once.** You need the order *and* the bed's patient. Wrap each
  `bus.request(…)` in `firstValueFrom` and `await Promise.all([…])`.
- **Ownership.** Without it, `/ward/icu-3/meds/<an ER-2 order>` would show the ER-2 order under
  ICU-3. An order belongs to a *patient* (`order.patientId`) and the URL names a *bed*, so compare
  `order.patientId` with the id of the patient in that bed.

<details>
<summary>Solution</summary>

```ts
import { computed, inject, resource } from '@angular/core';
import { RedirectCommand, ResourceContext, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  MessageBus,
  bedFromSlug,
  isMedOrderId,
  link,
  toSlug,
} from '@core/messaging/contract';

/** Blocking: the order in the URL, if it exists and belongs to the patient in this bed; otherwise back to the bed. */
export function medOrderResource(ctx: ResourceContext) {
  const bus = inject(MessageBus);
  const router = inject(Router);
  return resource({
    params: computed(() => {
      const id = String(ctx.params()['orderId'] ?? '');
      const bed = bedFromSlug(String(ctx.params()['bed'] ?? ''));
      return isMedOrderId(id) && bed ? { id, bed } : undefined;
    }),
    loader: async ({ params: { id, bed } }) => {
      const [order, patient] = await Promise.all([
        firstValueFrom(bus.request('/app/medication.get', { id })),
        firstValueFrom(bus.request('/app/patients.get', { bed })),
      ]);
      if (!order || !patient || order.patientId !== patient.id)
        throw new RedirectCommand(
          router.parseUrl('/' + link('ward/:bed', { bed: toSlug(bed) })),
        );
      return order;
    },
  });
}
```

</details>

### B7 · Page (5 min)

**Files:** new `ward/med-order/med-order-page.ts` and `.html`

Copy A7's component and change it:

1. The input is `order = input.required<MedOrder>()`. Its name must match the key you'll use in
   `resources` in B8.
2. **New:** the order has no bed, only a `patientId`. Build the back link from the URL instead:
   add `readonly bed = input.required<string>()`. Component input binding fills it from the
   `:bed` route param.
3. Show the drug, the dose and route (`{{ order().doseMg }} mg · {{ order().route }}`), the status
   as a chip (`<span class="chip">`), and who ordered it and when with `who(order().orderedBy)` and
   `clock(order().createdAt)` from `../ui/format`.

<details>
<summary>Solution</summary>

```ts
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { link, type MedOrder } from '@core/messaging/contract';
import { clock, who } from '../ui/format';

@Component({
  selector: 'app-med-order-page',
  imports: [RouterLink],
  templateUrl: './med-order-page.html',
  styles: '.narrow { max-width: 28rem } .back { text-decoration: none }',
})
export default class MedOrderPage {
  /** From `resources: … ({ order: … })`, blocking: a plain MedOrder that belongs to this bed. */
  readonly order = input.required<MedOrder>();
  /** The `:bed` route param, e.g. 'icu-3'. */
  readonly bed = input.required<string>();

  protected readonly bedLink = computed(() => '/' + link('ward/:bed', { bed: this.bed() }));
  protected readonly ordered = computed(
    () => `${who(this.order().orderedBy)}, ${clock(this.order().createdAt)}`,
  );
}
```

```html
<section class="page narrow">
  <a class="back" [routerLink]="bedLink()">← {{ bed().toUpperCase() }}</a>
  <h1>{{ order().drug }}</h1>
  <p class="muted">{{ order().doseMg }} mg · {{ order().route }} · ordered by {{ ordered() }}</p>
  <span class="chip" [class.ok]="order().status === 'given'">{{ order().status }}</span>
</section>
```

</details>

### B8 · Route and link (5 min)

1. **`ward/ward.routes.ts`:** add the route:
   ```ts
   {
     path: ':bed/meds/:orderId',
     title: 'Medication order',
     canActivate: [validBed, validMedOrderId],
     resources: (ctx) => ({ order: medOrderResource(ctx) }),
     loadComponent: () => import('./med-order/med-order-page'),
   },
   ```
   **New: where you put it matters.** There are already two `':bed/meds/new'` routes, and
   `:orderId` matches `new` too. The router takes the first route that matches. Put it **below
   both** `':bed/meds/new'` routes. If it comes first, the medication wizard becomes unreachable:
   your guard refuses `'new'` (`isMedOrderId('new')` is false), so a doctor clicking "Order
   medication" bounces back to the bed.
2. **`ward/bed-detail/medication-list.html`:** make the drug name a link:
   ```html
   <td><a [routerLink]="['meds', o.id]">{{ o.drug }}</a></td>
   ```
   Add `RouterLink` to the component's `imports` in `medication-list.ts`; it has no `imports` yet.
   The link is relative, and resolves against the bed's route: `/ward/er-2/meds/med_…`.

### Part B · Done when

| Check | Proves |
| --- | --- |
| Clicking a drug on `/ward/er-2` opens its order, with the drug on first paint | blocking resource + input binding |
| `/ward/er-2/meds/hello` lands on `/ward/er-2`, with no `medication.get` in the Dev log | guard |
| `/ward/er-2/meds/med_nothing` lands on `/ward/er-2` | resource: `null` |
| An ER-2 order's id under `/ward/icu-3/meds/…` lands on `/ward/icu-3` | resource: ownership |
| As a doctor, "Order medication" on `/ward/icu-3` still opens the wizard | route order |
| `/ward/icu-9/meds/<any id>` lands on `/ward` | `validBed` runs first |

### Stretch goals

- **Tab title.** Show "Medication order · ICU-3 · Ward Monitor". Make the route's `title` a function
  of the route, like `bedTitle` in `ward.routes.ts`; `provideAppSeo()` appends " · Ward Monitor".
- **Stale status.** As a nurse, open an order, mark it given in a second tab, and come back. The
  page still says `ordered`: the resource loads again only when its params change. Make it
  `nonBlocking()` and add a Refresh button that calls `order.reload()`, as the bed page does for
  `meds`. What happens to the input's type? And to the redirect for an unknown order? (The
  Angular guide describes the thrown `RedirectCommand` for *blocking* resources only: a
  non-blocking one has already opened the page.)
- **Nurses only.** Make the order page nurse-only with `canMatch: [hasRole('nurse')]` and a
  fallback route to `/forbidden`, as in the temperature lab.
