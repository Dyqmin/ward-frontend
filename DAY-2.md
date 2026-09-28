# Day 2 · Signals and components

Today you build the **Vitals card** of the bed screen: HR, SpO₂ and RR every second, a
live / stale chip, alarm chips, Pause and Full screen.

**The instructions are in the code.** Every file you work in starts with the exercises for that
file: what to build, where, and how to check it. This page only tells you where to start.

## 1. Run the app

```sh
pnpm start
```

1. Open <http://localhost:4200/login?mock> and join as a **nurse**.
2. On the nurse station, click a bed, e.g. **ICU-3**. This is the bed screen; the Vitals card is
   on the left, for now with only its heading and the chart.
3. The **Dev** toolbar (bottom left) has **Simulate outage (8 s)**: use it to test stale data.

## 2. Work through the files in this order

All in `apps/ward/src/app/ward/bed-detail/vitals/`:

| # | Open this file | Exercises | Topic |
| --- | --- | --- | --- |
| 1 | `vitals-card/vitals-card.ts` | 1.1–1.5 | Signals |
| 2 | `vital-reading/vital-reading.ts` | 2.1 | Component API: inputs |
| 3 | `vitals-card/vitals-card.ts` (again) | 2.2–2.5 | Component API: inputs, output, two-way, element access |
| 4 | `vitals-panel/vitals-panel.ts` | 3.1–3.3 | Component architecture |

Each file has a matching `.html` (the template) and a ready `.scss` (styles).
Everything else in `bed-detail/` (`components/`, `data/`) is ready-made: you don't change it.

## 3. Check your work

Keep the spec of the file you work on running:

```sh
pnpm nx test ward --include='**/vitals-card.spec.ts'
pnpm nx test ward --include='**/vital-reading.spec.ts'
pnpm nx test ward --include='**/vitals-panel.spec.ts'
```

Each test is named after its exercise (`Exercise 1.3: stale or live`, …), so you can see which
exercises are done. Tests of later exercises stay red until you get there.
