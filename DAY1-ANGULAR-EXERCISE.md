# Day 1 · Angular lab: record a temperature, end to end

**Pairs · 45 minutes + 10 minutes review**

A nurse records a patient's temperature: the one vital measured by hand, and the one feature Ward
Monitor still lacks. You won't write a feature from scratch. Every task is a small, marked gap in a
file that already has the structure.

| Task | File to edit | Size | Afternoon act |
| --- | --- | --- | --- |
| 1 · Fixture | `testing/record-temperature.fixture.ts` | ~10 lines | 3 · the mock ward behind `provideStomp()` |
| 2 · Route and guards | `ward/ward.routes.ts`, `ward/guards.ts`, `temperature-form.ts` | ~6 lines | 5 · `canMatch`, `canDeactivate` |
| 3 · Command | `save()` in `ward/temperature/temperature-form.ts` | ~25 lines | 4 · a command and its reply |
| 4 · Resilience | the same `save()` | ~5 lines | 4 · safe retries |

All paths are relative to `apps/ward/src/app/`. Look for `LAB TASK N` comments in those files.

## Getting started

```sh
git checkout day1-angular-start
pnpm install
pnpm start          # http://localhost:4200/ward?mock
```

1. Sign in as a **nurse**.
2. Open any bed.
3. Click **Record temperature**. The form opens, but Save does nothing yet.

In mock mode, a **Dev** toolbar at the bottom left:

- switches role (nurse or doctor)
- simulates an 8-second outage
- lists every command the fake broker received, with its `commandId`

### Already done for you

- **The form's template** (`temperature-form.html`): number input, Save button, "pending sync…"
  chip and error text.
- **The form's class** (`temperature-form.ts`): it already injects `MessageBus`, `Router` and
  `Toasts`, and has the signals the template uses.
- **The route** `':bed/temperature'`: it loads the form lazily, checks the bed with `validBed`, and
  loads the patient as a **blocking** router resource. So `patient()` is always there.
- **The contract**: `'vitals.record'` is in `RpcContract` (`shared/contract.ts`), so sending it
  already type-checks.
- **`commandRetry()`** (`core/messaging/command-retry.ts`), already used by the alarm buttons.

## Check your work

```sh
# the whole lab: one describe block per task
pnpm nx test ward --include='**/record-temperature.spec.ts'

# one task at a time
pnpm nx test ward --include='**/record-temperature.spec.ts' --filter='Task 1'
```

Do the tasks in order. A few tests pass before you start: they guard behavior you must not break.

## You already wrote half of this lab this morning

| Morning exercise | Where it shows up this afternoon |
| --- | --- |
| **Exercise 1**: literal types | `BedId` and `BedSlug` type the URL. `link('ward/:bed', { bed: this.slug() })` won't compile without its param. |
| **Exercise 2**: `isBedId` | `validBed` → `bedFromSlug` → **your** `isBedId` keeps `/ward/icu-9/temperature` out. |
| **Exercise 3**: utility types | `ManualVital = Extract<Vital, 'temp'>` is why `vital: 'hr'` doesn't compile. `Omit<…, keyof Command>` is why you never write a `commandId`. |
| **Step 2a**: guards | `isNurseId(ctx.actor)` in Task 1 narrows the sender to a `NurseId`. |
| **Step 2c**: `assertNever` | the `default` of your `switch` in Task 3 |

---

## Task 1 · Fixture (5 min)

**File:** `testing/record-temperature.fixture.ts`

The mock ward has no answer yet for `'vitals.record'`. The function is already wired into the mock
ward; fill in its body with the four numbered steps written in the file:

1. Only nurses. Check `ctx.actor` with `isNurseId`.
2. An empty bed is forbidden.
3. Anything outside 30–43 °C → `{ status: 'forbidden', reason: 'Implausible value' }`.
4. Otherwise store the reading in `ward.readings` and reply `{ status: 'accepted', value: null }`.

The reply's type comes from the contract. Try returning `{ status: 'ok' }` once and read the error.

**Done when** `--filter='Task 1'` is green.

## Task 2 · Route and guards (10 min)

**Who may open the form, and who may leave it?**

1. **`ward/ward.routes.ts`**, in the `':bed/temperature'` route:
   - `canMatch: [hasRole('nurse')]`
   - `canDeactivate: [unsentValueGuard]` (import it from `./guards`)
2. **Same file, right below it:** add a second route,
   `{ path: ':bed/temperature', redirectTo: '/forbidden' }`. When `canMatch` says no to a doctor,
   the router tries the next route with the same path. The medication wizard above does exactly
   this. The doctor never even downloads the form's code.
3. **`ward/guards.ts`:** write the body of `unsentValueGuard`. If `form.dirty()` is false, return
   `true`. Otherwise return `confirm('Discard the value you typed but did not save?')`.
4. **`temperature-form.ts`:** implement `dirty`. It is true when `value()` is not `''` and
   `saved()` is false.

**Done when** `--filter='Task 2'` is green:

- As a doctor, `/ward/icu-3/temperature` lands on `/forbidden`.
- As a nurse, leaving with a typed but unsent value asks first.

## Task 3 · Command (20 min)

**File:** `ward/temperature/temperature-form.ts`, method `save()`. The steps are written there as
comments.

- Send the command with `this.bus.send('/app/vitals.record', { bed, vital, value })`. You never
  write a `commandId` or `performedAt`: `send()` adds them.
- In `subscribe`, switch on the reply's `status`:
  - `accepted`: set `saved`, show a toast, and navigate back to the bed.
  - `forbidden`: show `r.reason`.
  - `conflict`: show who recorded it and when.
  - `default`: `assertNever(r)`.

<details>
<summary>Hint: the shape of the code</summary>

```ts
this.bus
  .send('/app/vitals.record', { bed: this.patient().bed, vital: 'temp', value })
  .subscribe({
    next: (r) => {
      switch (r.status) {
        case 'accepted':
          // saved, toast, navigate
          return;
        case 'forbidden':
          return this.error.set(r.reason);
        case 'conflict':
          return this.error.set(`Recorded by ${who(r.by)} at ${clock(r.at)}`);
        default:
          return assertNever(r);
      }
    },
  });
```

</details>

**Try:**
- Write `vital: 'hr'` or `bed: 'ICU-9'`. Neither compiles.
- Delete the `conflict` case and watch `assertNever(r)` complain.

Undo both afterwards.

**Done when** `--filter='Task 3'` is green:

- 37.2 is recorded and you're back on the bed detail, with no "discard?" question.
- 51 shows "Implausible value" and you stay on the form.

## Task 4 · Resilience (10 min)

**File:** the same `save()`.

1. Call `this.pending.set(true)` before sending.
2. Between `send(…)` and `.subscribe(…)`, add
   `.pipe(commandRetry(this.bus), finalize(() => this.pending.set(false)))`. Import `finalize`
   from `rxjs`.
3. Add an `error` handler in `subscribe`: "Broker unreachable — not saved. Try again."

**Why a retry is safe here:** `send()` stamps **one** `commandId`, and every retry resends the same
body. The broker answers a `commandId` it has already seen with the stored result, so one Save is
always one reading.

**By hand:**

1. In the Dev toolbar, click **Simulate outage**, then click Save.
2. The chip says "pending sync…".
3. The log shows several attempts with one `commandId`.
4. The save completes by itself when the ward comes back.

**Done when** `--filter='Task 4'` is green, and so is the whole spec.

## Done when: the seven checks from the slides

| Check | Proves |
| --- | --- |
| `vital: 'hr'`, `vital: 'temperature'` or a missing bed does not compile | the contract |
| As a doctor, `/ward/icu-3/temperature` falls through to `/forbidden` (Network tab: the chunk is not requested) | `canMatch` |
| `/ward/icu-9/temperature` redirects to `/ward` | `validBed` |
| The form header shows the patient's name on first paint | blocking resource |
| 37.2 is accepted and returns to the bed detail; 51 shows "Implausible value" | `CommandResult` |
| During an outage, the Dev log shows two or more attempts with the same `commandId`, and one reading | safe retry |
| Leaving with a typed but unsent value asks for confirmation | `canDeactivate` |

## Stretch goals (no tests)

- **Conflict branch.** In the fixture, reply `{ status: 'conflict', by, at }` when another nurse
  recorded the same bed less than 60 s ago. Your `switch` already shows it.
- **Tab title.** Show "Record temperature · ICU-3 · Ward Monitor". Make the route's `title` a
  function of the route, like `bedTitle` in `ward.routes.ts`; `provideAppSeo()` adds the rest.
- **Read the route resource.** Open `patientResource()` in `ward/bed-detail/bed-resources.ts`. Why
  does an empty bed (`/ward/icu-6/temperature`) end up on `/ward?empty=ICU-6`?
- **`RPC_GUARDS`.** Remove the last `as` in `StompMessageBus.request()` with a mapped type, built
  like `FRAME_GUARDS` in `core/messaging/contract.ts`.

## Stuck?

`git diff day1-angular-start day1-angular-solution` shows the whole solution.
