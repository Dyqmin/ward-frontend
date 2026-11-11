# P2 · Computation in templates

**Where:** nurse station (alarm count, ward headings, tiles) and the alarm chips in each tile.

**Every expression in a template runs again on every check of that component.** It doesn't matter
how you write it: a method, a getter, an inline `.filter()`, an impure pipe. All of them behave the
same way.

OnPush and signals make checks rarer, but they still happen. The nurse station is checked every
second because of the shift clock, and each tile is checked every second because of its "age".

## See it

Set P2 ❌, turn the counters on and open **⚡ Perf → Calculations / s**:

| ❌ BAD                                       | ✅ GOOD                                | Calculations/s ❌ → ✅ |
| -------------------------------------------- | -------------------------------------- | ---------------------- |
| method `alarmsOf(bed)` → tile input          | `alarmsFor()(bed)` from a `computed()` | 18 → 0                 |
| getter `get urgentNow()`, read twice         | `urgentCount = computed(…)`            | 1–2 → 0                |
| `allAlarms().filter((a) => …).length` inline | `alarmsPerWard()` from a `computed()`  | (not counted)          |
| method `chipText(a)` inside `@for`           | pure pipe `a \| alarmChip`             | 1 per chip → 0         |

The ✅ versions show 0 while nothing changes. They run once when an alarm changes. With ❌, the
`BedTile` badges climb twice as fast (36/s instead of 18/s).

## Why

There are two separate costs:

1. **The work is repeated.** It runs once per check instead of once per change, for every tile and
   every row. Formatting is expensive: `toLocaleTimeString({…})` builds a new `Intl` formatter on
   each call.
2. **A new reference is passed down.** `.filter()` or `.map()` returns a new array, and to a child's
   input a new array is a changed value (`!==`). OnPush can't skip that child, so the whole subtree
   re-renders.

```ts
// ❌ looks like a property, but it runs on every check
get urgentNow() { return this.alarms().filter(isUrgent).length; }

// ✅ runs when alarms() changes; a check only reads the cached value
urgentCount = computed(() => this.alarms().filter(isUrgent).length);
```

```html
<!-- inside @for there is no computed() for each row, so use a pure pipe for row values -->
{{ a | alarmChip }}
```

## Fine in a template

- Reading signals: `count()`, `user().name`.
- Cheap methods that return primitives, such as `isUrgent(a)` or `patients.patient(bed)`.
- Literals like `[queryParams]="{ ward: w }"` or `[items]="[a, b]"`. The compiler memoizes them, so
  you get a new object only when `w` changes.
- Event handlers like `(click)="save()"`. They run on the event, not on every check.

## Rules

- **Component-level derived data → `computed()`.** Don't use a getter or a method, and don't use
  `effect()` plus `set()`.
- **Per-row derived data in `@for` → a pure pipe** (pipes are pure by default). Alternatively, build a
  view model once in the store or a `computed()`.
- **Pure pipes compare by reference.** If you mutate an array in place, the pipe won't run again.
- **`pure: false` makes a pipe behave like a method.** Avoid it, except for cheap built-ins like `async`.
- **Arrow functions in templates are new syntax, but the cost is the same.** `.filter()` runs on every
  check.
- **Pass stable references to child inputs.**
- **Need a value several times in a template?** `@let n = urgentCount();` reads it once per check.
- **To find the cost, use the Angular DevTools Profiler.** It shows time per component. The
  Performance panel shows the function names.
