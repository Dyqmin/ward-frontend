# Day 2 · Signals and components

Today you build the **Vitals card** on the bed screen (`/ward/icu-3`): the latest HR, SpO₂ and RR,
a live / stale chip, a Pause button and a Full screen button. You start with signals inside the
bed screen, turn the markup into reusable components, and finish by splitting the card into a
smart container and presentational components.

## Run it

```sh
pnpm start
```

Open <http://localhost:4200/login?mock>, join as a **nurse**, then open <http://localhost:4200/ward/icu-3>.
In mock mode the **Dev** toolbar (bottom left) has **Simulate outage (8 s)**: use it whenever an
exercise talks about stale data.

## Checks

| Part | How to check |
| --- | --- |
| Part 1 | In the browser, with the steps under each exercise |
| Part 2 | `pnpm nx test ward --include='**/vital-reading.spec.ts'` and `pnpm nx test ward --include='**/vitals-card.spec.ts'` |
| Part 3 | Both specs above stay green, and the browser checks from Part 1 still pass |

Styles are ready in every file you work on; you only write TypeScript and templates.

---

## Part 1 · Signals

Work in `ward/bed-detail/bed-detail.ts` and `bed-detail.html`. The vitals of the bed arrive as the
`vitals` input: a Resource holding the last ten minutes of frames, newest last.

### 1.1 The latest frame

- Add `latest`: the newest frame in `vitals`, or `undefined` while there is none. It must update by
  itself whenever a new frame arrives.
- In the template, where it says `EXERCISE 1.1`, show `HR … bpm · SpO₂ … % · RR … /min` from
  `latest`. Plain text is fine; Part 2 replaces it.

**Done when:** the three numbers change every second.

### 1.2 How old is the data

- Add `ageSec`: how many whole seconds ago the latest frame was taken (`frame.ts`), or `null` with
  no frame.
- "Now" comes from the `Clock` service (`@core/clock`): its `now` ticks once per second. Do not
  start your own timer.

**Done when:** you can show `ageSec` for a moment and it stays at 0–1 while data flows.

### 1.3 Stale or live

- Add `stale`: `true` when the connection is down (`MessageBus.connected`) **or** the data is older
  than `STALE_AFTER_SEC` (`ward/ui/format.ts`).
- Where it says `EXERCISE 1.3`, once there is a frame, show one chip:
  - stale: `<span class="chip warn">no data for {{ … }} s</span>`
  - otherwise: `<span class="chip ok">live</span>`

**Done when:** Simulate outage turns the chip into `no data for N s` with N counting up, and it goes
back to `live` when the outage ends.

### 1.4 Pause

A nurse wants to freeze the numbers to read them out, while the chart keeps running.

- Add `paused` (starts `false`) and a button next to the chip: `Pause` when running, `Resume` when
  paused. Clicking it flips `paused`.
- Add `shown`: the frame the numbers display. While running it follows `latest`; while paused it
  keeps the frame it had at the moment of pausing. Build it from `latest` and `paused` together,
  with no click handler copying frames around.
- Show the numbers from `shown` instead of `latest`, and while paused show `<span class="chip">paused</span>`
  instead of the live / stale chip.

**Done when:** after Pause the numbers stop while the chart moves on; after Resume they jump to the
current values.

### 1.5 Warn when the data goes stale

- Every time `stale` turns `true`, show a warning toast `ICU-3: no live vitals` (the bed from
  `patient()`) with `Toasts.show(text, 'warn')` from `@core/ui/toasts`.
- Only `stale` may decide when this runs: reading the patient's bed must not make it run again.

**Done when:** one outage gives exactly one toast.

---

## Part 2 · Component API

Turn the markup from Part 1 into two components. Names matter here: the specs use them.

### 2.1 `VitalReading` (`ward/bed-detail/vital-reading.ts`)

One reading: a label, a big value and a unit.

- Inputs: `label` (string, required), `vital` (`StreamedVital`, required), `value` (number,
  required), `unit` (string, default `''`), `stale` (boolean, default `false`).
- Template:
  - `<span class="label">`, `<span class="value">`, and `<span class="unit">` only when there is a unit.
  - The value gets the class `out` when it is outside the thresholds. Use `isOutOfRange(vital, value)`
    from `@core/messaging/contract`.
- The component's own element gets the class `stale` when `stale` is `true`.
- Use it three times in `bed-detail.html` instead of the plain text from 1.1.

**Done when:** `pnpm nx test ward --include='**/vital-reading.spec.ts'` is green.

### 2.2 `VitalsCard` (`ward/bed-detail/vitals-card.ts`)

The whole card. Move the `<section class="card vitals">` from `bed-detail.html` into it.

- Inputs: `frame` (`VitalsFrame | undefined`, required), `stale` (default `false`), `ageSec`
  (`number | null`, default `null`).
- It shows the heading `Vitals`, the chip from 1.3 and three `app-vital-reading`, only when there
  is a frame.
- Whatever the parent puts between `<app-vitals-card>` and `</app-vitals-card>` appears at the end
  of the card. The bed screen puts the chart, the error message and the loading skeleton there.
- `bed-detail.html` uses `<app-vitals-card>`; `BedDetail` passes `shown()`, `stale()` and `ageSec()`.

**Done when:** the `Exercise 2.2` tests in `vitals-card.spec.ts` pass.

### 2.3 Pause, from the card

- Move the Pause / Resume button into the card, in the heading after the chip. The chip `paused`
  moves too.
- The card gets an input `paused` (default `false`) and tells the parent about a click with an
  output named **`pausedChange`** that emits the new value (`true` after Pause).
- `BedDetail` keeps owning `paused`: it passes it in and updates it from `pausedChange`.

**Done when:** the `Exercise 2.3` test passes, and Pause still works in the browser.

### 2.4 Pause, two-way

- Replace the `paused` input and the `pausedChange` output with **one** member named `paused` that
  the card can also write itself. Clicking the button now changes `paused` inside the card.
- In `bed-detail.html`, bind it in both directions with one binding.

**Done when:** the `Exercise 2.4` tests pass. The 2.3 test must stay green: from the outside, the
API is the same as before.

### 2.5 Full screen

The bedside display should show only the vitals.

- Add a `Full screen` button to the card, next to Pause.
- Clicking it calls `requestFullscreen()` on the card's own `<section class="card vitals">`. Get
  hold of that element from the component class, without `document.querySelector`.

**Done when:** the `Exercise 2.5` test passes, and the button shows the card full screen in the
browser.

---

## Part 3 · Component architecture

`BedDetail` now does two jobs: it is the bed page, and it runs the vitals logic. Split the jobs.

### 3.1 A smart container: `BedVitals` (`ward/bed-detail/bed-vitals.ts`)

- Inputs: `bed` (`BedId`, required) and `vitals` (the same Resource type as in `BedDetail`, required).
- Move into it everything you added in Part 1: `latest`, `ageSec`, `stale`, `paused`, `shown` and
  the toast. Move the `<app-vitals-card>` with its projected chart, error and skeleton into its
  template.
- `bed-detail.html` renders only `<app-bed-vitals [bed]="patient().bed" [vitals]="vitals()" />`.
  `BedDetail` no longer knows about `Clock`, `MessageBus`, `Toasts` or the chart.

**Done when:** the bed screen works exactly as before (chip, Pause, toast, full screen), and both
specs are green.

### 3.2 Check the split

Go through your three components and fix whatever does not hold:

- **`VitalReading` and `VitalsCard` are presentational.** They get plain values through inputs and
  report through outputs or the model. They inject no services and know nothing about Resources,
  the bus or the clock. `vitals-card.spec.ts` creates the card with no providers at all: if the
  card injected `MessageBus`, it would fail.
- **`BedVitals` is smart.** It gets the data, owns the state (`paused`), and makes the decisions
  (stale, toast). It has almost no markup of its own.
- **Data flows down, events flow up.** No child reaches into its parent.

Be ready to answer: could `VitalsCard` show the vitals of a phone monitor, a recorded session or
a test fixture without any change? Why?

### 3.3 Stretch: reusable liveness

"How old is the newest frame, and is it stale" is not specific to the bed screen.

- Create `ward/bed-detail/liveness.ts` with a function `liveness(lastAt)`: it takes a signal with
  the time of the newest frame (in ms, or `undefined`) and returns `{ ageSec, stale }` as signals.
  It gets `Clock` and `MessageBus` itself.
- Use it in `BedVitals` instead of your own `ageSec` and `stale`.

**Done when:** `BedVitals` has no `Clock` or `MessageBus` left, and the stale chip and the toast
still work.
