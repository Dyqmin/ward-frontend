# Day 3 · Observables and RxJS

Today you work with Observables: subscribing, cleaning up, showing values with the async pipe,
the most common operators, Subject and BehaviorSubject, combining streams, switchMap /
mergeMap / exhaustMap and sharing one stream between many listeners.

**The instructions are in the code.** Every exercise file starts with its steps: what to
build, where, and how to check it. This page only tells you where to start.

## 1. Run the app

```sh
pnpm install
pnpm start
```

1. Open <http://localhost:4200/login> (with the real backend) or
   <http://localhost:4200/login?mock> (the in-memory ward, no backend needed), type any name,
   keep the role **Nurse** and the room code `ward-demo`, and click **Join ward**.
2. Click **Streams** in the header. Each tab is one exercise.
3. Top right: **Active vitals subscriptions: N** counts the open subscriptions to live vitals,
   in both modes. You will use it to see leaks and sharing.
4. Some exercises write to the browser console: open it with F12 → Console.

## 2. Work through the tabs in this order

All in `apps/ward/src/app/streams/`:

| Tab | Open this file | Exercises | Topic |
| --- | --- | --- | --- |
| R.1 | `r01-subscribe/subscribe-basics.ts` | R.1a–c | subscribe, next, complete |
| R.2–3 | `r02-leak/leaky-vitals.ts` | R.2a–c, R.3 | a leak, and takeUntilDestroyed |
| R.4–5 | `r04-view/live-hr.ts` | R.4a–b, R.5a–b | why the view doesn't update; the async pipe |
| R.6 | `r06-operators/operators.ts` | R.6a–d | map, filter, take, distinctUntilChanged, tap |
| R.7–8 | `r07-subjects/notes.ts` | R.7a–c, R.8a–b | Subject, BehaviorSubject |
| R.9 | `r09-combine/patient-filter.ts` | R.9a–d | combineLatest, debounceTime |
| R.10–12 | `r10-flattening/flattening.ts` | R.10a–b, R.11, R.12a–c | switchMap, mergeMap, exhaustMap |
| R.13 | `r13-share/shared-hr.ts` | R.13a–c | shareReplay |

Each file has a matching `.html` (the template) and a ready `.scss` (styles). The sources you
need are ready in `streams-data.ts`; you don't change that file.

## 3. Check your work

Every exercise file names its spec. Run it after every step (it runs once, so run it again
after each change), for example:

```sh
pnpm nx test ward --include='**/subscribe-basics.spec.ts' --reporters=verbose
```

- Every test is named after its exercise; ✓ passes, × fails.
- Some steps are checked only in the browser, on purpose: R.2 (you build a leak) and R.4 (a
  view that doesn't update). Their files say what you should see.
- In R.11 and R.12a you use the wrong operator on purpose: the R.10 / R.12 tests turn red
  there, and green again when you switch back.
- If a template doesn't compile, **every** test of that file fails. Read the first error at the
  top of the output.
