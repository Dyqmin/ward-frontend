# Guards and route resources: solution and design decisions

The companion to `ROUTE-GUARDS-RESOURCES-EXERCISE.md` (and `ROUTE-GUARDS-RESOURCES-TIPS.md`). The first half explains **why** the lab
looks the way it does. The second half walks through **how** each step was solved, in the order of
the exercise.

## Branches

| Repo | Branch | What's on it |
| --- | --- | --- |
| `ward-frontend` | `day3-routing` | Starter: the exercise and the cheat sheet; `medication.get` already in the contract |
| `ward-frontend` | `day3-routing-solution` | Parts A and B done, plus this file |
| `ward-worker` | `main` | Everything: `patients.byId`, `medication.get`, `patients.search` |
| `ward-worker` | `day3-routing` | Starter for B1: the `query()` case and `WardState.medication()` are `LAB B1` comments |
| `ward-worker` | `day3-routing-solution` | B1 done; identical to `main` |

The temperature lab from day 1 (`record-temperature.spec.ts`) is still a starter on these branches.
Its 13 failing tests are expected; every other test passes.

---

## Part 1 · Decisions

### What to build

**Detail pages for one record by id.** A detail page by id needs exactly the two things the lab
teaches: a guard that checks the URL, and a route resource that loads a record before the page
opens. The app already had both kinds of code, but participants had only read them: the bed page's
resources were written for them, and the day 1 lab's route was pre-built.

**Patients for the demo, medication orders for the exercise.** Both are seeded on every occupied
bed, both are already visible on the bed page, and the server never deletes either, so a link to
one keeps working.

**Not alarms.** An alarm was the first candidate for the exercise, but the backend keeps only
*active* alarms: `WardState` deletes an alarm when it resolves, 10 s after it is back in range. Most
beds show "No active alarms" most of the time, and a detail URL would stop working seconds after it
was opened.

**The same eight steps in both parts.** Backend, contract, mock, link, guard, resource, page,
route. Part B repeats Part A's numbering, so A*n* is the worked example for B*n*. Part B adds only
three new ideas: a resource with two params, an ownership check, and a route whose position
matters.

### Route resources, not classic resolvers

The first version of the lab used a classic `ResolveFn` (`resolve: { … }`), on the theory that
the app had none and a snapshot-versus-live contrast would be worth teaching. It was switched to
route resources before the lab ran:

- **It's what Angular now presents for data fetching.** The
  [guide](https://next.angular.dev/guide/routing/data-fetching-with-resources) lists the reasons:
  resources on all matched routes load concurrently (resolvers run one route at a time), a resource
  can be `nonBlocking()`, and it reloads when its params change. `ResolveFn` isn't deprecated, but
  it's the older pattern.
- **It's what this app already does.** `patientResource()` and the other factories in
  `ward/bed-detail/bed-resources.ts` load the bed page. A resolver would have taught a second pattern
  the codebase doesn't follow.
- **The guards didn't change.** Only step 6 (and the route's `resources:` line) differs.

The exercise keeps one paragraph on `ResolveFn`, so participants recognise it in older code.

### Backwards compatibility

- **Additive only.** Two new query RPCs and two new routes. No existing route, RPC or screen changes
  behaviour; the only visible change is that the patient's name and each drug name became links.
- **Deploy the backend first.** The Worker throws a `ProtocolError` on an RPC name it doesn't know,
  which sends an ERROR frame and **closes the socket**. An old frontend on the new backend is
  fine; a new frontend on an old backend loses its connection as soon as it opens one of the pages.

### Backend

- **Queries, not commands.** Reading a record needs no `commandId`, idempotency, role check or
  broadcast event. `IS_COMMAND` marks both as `false`.
- **`null` for an unknown id**, like `patients.get` for an empty bed. The resource turns `null` into
  a redirect, so the page never sees it.
- **No role check.** Both roles can already read patients and orders through `patients.get` and
  `medication.list`.
- **`medication()` returns a copy** of the stored order, as `medications()` does, so a caller can't
  change server state through a reply.
- **`patientById()` searches by value.** Patients are stored by bed; 15 entries don't justify a
  second index.
- **The ownership check stays on the frontend.** The resource asks for the order and for the bed's
  patient and compares them. Adding a `bed` field to `MedOrder`, or a `{ bed, id }` request, would
  have changed existing types for one page.

### Frontend: guards and resources

- **The guard checks the URL's shape; the resource checks the data.** The guard is synchronous and
  sends no request, so `/ward/patients/hello` is refused before anything goes over the socket.
  Whether the record exists, and whether it belongs to this bed, needs a request, so it's the
  resource's job.
- **`canActivate`, not `canMatch`, for the id guards.** A wrong id should redirect, not make the
  route disappear so the router tries the next one. `canMatch` stays for roles (`hasRole`).
- **The resource checks the id again, in `params`.** A guard narrows nothing for later code:
  `ctx.params()` hands over the raw `string`. Returning the id from `params` only after
  `isPatientId(id)` gives the loader a `PatientId`, and returning `undefined` otherwise keeps the
  resource idle instead of sending a bad request.
- **`inject()` in the factory, never in the loader.** The router calls the factory in an injection
  context; the loader runs later, outside it (NG0203).
- **Blocking, and redirect by throwing.** A blocking resource that throws a `RedirectCommand`
  cancels the navigation, so the page never opens with `null`. It's the same move as
  `patientResource()` for an empty bed.
- **Where each redirect goes.** A bad patient id goes to `/ward`, because a patient URL has no bed.
  A bad order id goes back to **the bed** in the URL, which the user just came from.
- **Two params as one object.** The order resource's `params` returns `{ id, bed }`, with `bed`
  already a `BedId` from `bedFromSlug()`. The redirect converts it back with `toSlug()`, because
  `link()` wants the slug.
- **Two requests in parallel.** `Promise.all` over `medication.get` and `patients.get`, so the
  ownership check costs no extra round trip.
- **It reloads on param changes.** Going from one patient to another inside the app reuses the page,
  and the resource loads the new patient. The status of an order still doesn't update by itself
  when a nurse marks it given elsewhere; `nonBlocking()` plus `reload()` is a stretch goal.

### Frontend: routes and pages

- **`patients/:patientId` sits above `:bed`.** It can't clash, because `:bed` matches exactly one
  segment and this path has two, but reading top-down is easier.
- **`:bed/meds/:orderId` sits below both `:bed/meds/new` routes.** Otherwise `new` matches as an
  `:orderId`. The guard would still refuse `'new'`, but the wizard would become unreachable. The
  guard is a second line of defence, not a reason to ignore route order.
- **`canActivate: [validBed, validMedOrderId]`.** `validBed` runs first, so `/ward/icu-9/meds/…`
  goes to `/ward`, not to a bed that doesn't exist.
- **Loaded data arrives as an input.** `withComponentInputBinding()` and `withRouterResources()`
  were already on. The input's name is the key in `resources`, and a blocking resource binds the
  plain value (`MedOrder`), not a `Resource<MedOrder>`.
- **The order page reads `bed` from the URL.** An order knows only its `patientId`, so the back link
  uses the `:bed` param, which component input binding also delivers as an input.
- **Links are strings.** `link()` returns `'ward/patients/pat_…'`. Passing it inside an array
  (`['/', link(…)]`) makes the router treat it as one segment and encode its slashes
  (`/ward%2Fpatients%2F…`), so the link fell back to `/ward`. The browser check caught this; the
  exercise file now warns about it in A8.
- **Typed paths.** Both routes were added to `AppPath`, so `link()` refuses a missing param.
- **Two inline style rules.** `.page`, `.muted` and `.chip` are global; `.narrow` and `.back` live
  only in the temperature form's stylesheet, so both new pages declare them inline.
- **Static titles** ("Patient", "Medication order"). A title computed from the URL, like
  `bedTitle`, is a stretch goal.

### What participants get for free

The course ran short on time, so the typing-only parts of Part B are done in advance:

- **Frontend:** `medication.get` in `RpcContract` and `REQUEST_GUARDS` (B2).
- **Backend:** `medication.get` in `RpcContract`, `REQUEST_GUARDS` and `IS_COMMAND`. Participants
  write only the `query()` case and `WardState.medication()`.
- **Why the backend check says "LAB B1 comments are gone":** `query()` doesn't have to handle
  every name, so the typecheck passes before any work is done. A missing `case` shows up only at
  runtime, as an empty reply.
- **Mock replies are optional** in `MockFixtures`, so forgetting B3 still compiles. It fails at
  runtime with "No fixture for /app/…" in the Dev toolbar's log.
- **A cheat sheet** (`ROUTE-GUARDS-RESOURCES-TIPS.md`) has the patterns as generic snippets, which
  file to copy each one from, and a troubleshooting table of the mistakes this lab invites. It
  doesn't contain the solutions; those are folded under each step of the exercise.

---

## Part 2 · How it was solved

Frontend paths are relative to `apps/ward/src/app/`.

### Step 1 · Backend (`ward-worker`)

For each RPC, four edits. The typecheck points to the first three in turn.

1. **`src/shared/contract.ts`:** the `RpcContract` entry and its request guard.
   ```ts
   'patients.byId':    { req: { id: PatientId };  res: Patient | null };
   'medication.get':   { req: { id: MedOrderId }; res: MedOrder | null };

   'patients.byId': (x): x is RpcContract['patients.byId']['req'] =>
     isObj(x) && typeof x.id === 'string' && isPatientId(x.id),
   'medication.get': (x): x is RpcContract['medication.get']['req'] =>
     isObj(x) && typeof x.id === 'string' && isMedOrderId(x.id),
   ```
2. **`src/room/ward-room.ts`:** `false` in `IS_COMMAND`, and a `case` in `query()`.
   ```ts
   case 'patients.byId':
     if (!REQUEST_GUARDS[name](body)) throw invalid();
     return this.state.patientById(body.id);
   case 'medication.get':
     if (!REQUEST_GUARDS[name](body)) throw invalid();
     return this.state.medication(body.id);
   ```
3. **`src/room/ward-state.ts`:** the lookups.
   ```ts
   patientById(id: PatientId): Patient | null {
     return [...this.patients.values()].find((p) => p.id === id) ?? null;
   }

   medication(id: MedOrderId): MedOrder | null {
     const m = this.meds.get(id);
     return m ? { ...m.order } : null;
   }
   ```
4. **`FRONTEND.md`:** a row per RPC in the queries table.

### Step 2 · Frontend contract (`shared/contract.ts`)

The same `RpcContract` entries and `REQUEST_GUARDS` as in step 1.1; this is the frontend's own
copy of the file. The mapped type makes `tsc` fail until both are there.

### Step 3 · Mock (`testing/ward-fixtures.ts`)

In `createWardFixtures()`, under the queries:

```ts
'/app/patients.byId': ({ id }) =>
  [...ward.patients.values()].find((p) => p.id === id) ?? null,

'/app/medication.get': ({ id }) => ward.orders.get(id) ?? null,
```

### Step 4 · Typed links (`core/messaging/contract.ts`)

```ts
  | 'ward/:bed/meds/:orderId'
  | 'ward/patients/:patientId'
```

### Step 5 · Guards (`ward/guards.ts`)

```ts
export const validPatientId: CanActivateFn = (route) =>
  isPatientId(route.params['patientId'] ?? '') ||
  new RedirectCommand(inject(Router).parseUrl('/ward'));

export const validMedOrderId: CanActivateFn = (route) =>
  isMedOrderId(route.params['orderId'] ?? '') ||
  new RedirectCommand(
    inject(Router).parseUrl('/' + link('ward/:bed', { bed: route.params['bed'] })),
  );
```

### Step 6 · Route resources

**`ward/patient/patient-resource.ts`**

```ts
export function patientByIdResource(ctx: ResourceContext) {
  const bus = inject(MessageBus);
  const router = inject(Router);
  return resource({
    params: computed(() => {
      const id = String(ctx.params()['patientId'] ?? '');
      return isPatientId(id) ? id : undefined;
    }),
    loader: async ({ params: id }) => {
      const patient = await firstValueFrom(bus.request('/app/patients.byId', { id }));
      if (!patient) throw new RedirectCommand(router.parseUrl('/ward'));
      return patient;
    },
  });
}
```

**`ward/med-order/med-order-resource.ts`**

```ts
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

### Step 7 · Pages

**`ward/patient/patient-page.ts`** has one input, `patient = input.required<Patient>()`. It
computes `bedLink` with `link('ward/:bed', { bed: toSlug(patient().bed) })` and `admitted` with
`clock()`. The template shows a back link, the name, the id and the admission time.

**`ward/med-order/med-order-page.ts`** has two inputs: `order = input.required<MedOrder>()` from
the resource, and `bed = input.required<string>()` from the URL. It computes `bedLink` and
`ordered` (`who(orderedBy)` and `clock(createdAt)`). The template shows the drug, dose, route,
who ordered it, and the status as a chip.

Both declare `imports: [RouterLink]` and the two inline style rules.

### Step 8 · Routes and links

**`ward/ward.routes.ts`**, right after the second `':bed/meds/new'` route:

```ts
{
  path: ':bed/meds/:orderId',
  title: 'Medication order',
  canActivate: [validBed, validMedOrderId],
  resources: (ctx) => ({ order: medOrderResource(ctx) }),
  loadComponent: () => import('./med-order/med-order-page'),
},
{
  path: 'patients/:patientId',
  title: 'Patient',
  canActivate: [validPatientId],
  resources: (ctx) => ({ patient: patientByIdResource(ctx) }),
  loadComponent: () => import('./patient/patient-page'),
},
```

Both come before the bed detail route (`':bed'`).

**`ward/bed-detail/bed-detail.html`:** the name in the `<h1>` is a link. `bed-detail.ts` imports
`link` and exposes it with `protected readonly link = link;`.

```html
<a [routerLink]="'/' + link('ward/patients/:patientId', { patientId: patient().id })"
  >{{ patient().name }}</a
>
```

**`ward/bed-detail/medication-list.html`:** each drug name is a relative link. `medication-list.ts`
gained `imports: [RouterLink]`; it had no `imports` before.

```html
<td><a [routerLink]="['meds', o.id]">{{ o.drug }}</a></td>
```

A relative link resolves against the bed's route, so it becomes `/ward/er-2/meds/med_…`.

---

## How it was verified

- **Types and lint:** `npx tsc -p apps/ward/tsconfig.app.json --noEmit` is clean. `npx nx lint ward`
  has no errors; its warnings are all in the unfinished day 1 lab.
- **Unit tests:** `npx nx test ward` runs 43 passing tests. The 13 failures are all in the
  unfinished day 1 temperature lab.
- **Backend:** `npm run typecheck` is clean and 189 tests pass.
- **In the browser**, with `?mock`, signed in as a doctor:

| Check | Result |
| --- | --- |
| Click the name on `/ward/er-2` | `/ward/patients/pat_er2`, "Patient · Ward Monitor", the name on first paint |
| `/ward/patients/hello` | `/ward` |
| `/ward/patients/pat_nobody` | `/ward` |
| Click a drug on `/ward/er-2` | `/ward/er-2/meds/med_7`, "Medication order · Ward Monitor" |
| `/ward/er-2/meds/hello` | `/ward/er-2` |
| `/ward/er-2/meds/med_nothing` | `/ward/er-2` |
| ER-2's order under `/ward/icu-3/meds/med_7` | `/ward/icu-3` |
| `/ward/icu-9/meds/med_7` | `/ward` |
| "Order medication" on `/ward/icu-3` | `/ward/icu-3/meds/new/patient`: the wizard still opens |
| In-app navigation from `pat_er2` to `pat_icu1` | The same page shows the new patient: the resource reloaded |
