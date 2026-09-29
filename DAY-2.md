# Day 2 · Signals and components

Today you build the **Vitals card** of the bed screen: HR, SpO₂ and RR every second, a
live / stale chip, alarm chips, Pause and Full screen.

You start with a short warm-up on fixed data, to try the four signal primitives one at a time.

**The instructions are in the code.** Every file you work in starts with the exercises for that
file: what to build, where, and how to check it. This page only tells you where to start.

## 1. Run the app

```sh
pnpm install
pnpm start
```

1. Open <http://localhost:4200/login?mock>, type any name, keep the role **Nurse** and the room
   code `ward-demo`, and click **Join ward**.
2. On the nurse station, click a bed, e.g. **ICU-3**. This is the bed screen; the Vitals card is
   on the left, for now with only its heading and the chart.
3. The **Dev** toolbar (bottom left) has **Simulate outage (8 s)**: use it to test stale data.

## 2. Work through the files in this order

| # | Open this file | Exercises | Topic |
| --- | --- | --- | --- |
| 0 | `apps/ward/src/app/warmup/warmup.ts` (page: **Warm-up** in the header) | 0.1–0.5 | Warm-up: signal, computed, effect, linkedSignal |

Then, all in `apps/ward/src/app/ward/bed-detail/vitals/`:

| # | Open this file | Exercises | Topic |
| --- | --- | --- | --- |
| 1 | `vitals-card/vitals-card.ts` | 1.1–1.5 (1.5 is a stretch) | Signals |
| 2 | `vital-reading/vital-reading.ts` | 2.1 | Component API: inputs |
| 3 | `vitals-card/vitals-card.ts` (again) | 2.2–2.5 | Component API: inputs, output, two-way, element access |
| 4 | `vitals-panel/vitals-panel.ts` | 3.1–3.3 | Component architecture |

Each file has a matching `.html` (the template) and a ready `.scss` (styles).
Everything else in `bed-detail/` (`components/`, `data/`) is ready-made: you don't change it.

## 3. Check your work

Run the spec of the file you work on after every step (it runs once, so run it again after each
change):

```sh
pnpm nx test ward --include='**/warmup.spec.ts' --reporters=verbose
pnpm nx test ward --include='**/vitals-card.spec.ts' --reporters=verbose
pnpm nx test ward --include='**/vital-reading.spec.ts' --reporters=verbose
pnpm nx test ward --include='**/vitals-panel.spec.ts' --reporters=verbose
```

- Every test is named after its exercise (`Exercise 1.3: stale or live`, …); ✓ passes, × fails.
  The pause test covers 1.4a and 1.4b together.
- Tests of later exercises are mostly red until you get there; a few turn green early. What
  counts is that the tests of the exercise you just did are green.
- If a template doesn't compile, **every** test of that file fails. Read the first error at the
  top of the output.
- 1.2, 3.2 and 3.3 have no test: check them in the browser and by reading your code, as their
  instructions say.
