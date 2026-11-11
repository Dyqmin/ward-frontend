# P4 · Hot events

**Where:** bed detail → chart (`vitals-chart.ts`). Move the mouse over it.

`pointermove`, `scroll`, `input`, `resize` fire dozens of times per second. A listener in a
template marks the component dirty **every time** → the template re-runs every time.

## See it

P4 ❌, open a bed, Performance panel → record while moving the mouse over the chart.

- Long yellow **scripting** blocks per move: `pointsOf()` rebuilds 3 × 600 points each time.
- Purple **Layout** blocks, "Forced reflow" warnings: `getBoundingClientRect()` on every move.

## Why

```ts
// ❌ BAD: a method in the template — runs on every check, i.e. on every mouse move
[attr.points]="pointsOf(p.vital)"
// ❌ BAD: reads layout on every move
const r = svg.getBoundingClientRect();

// ✅ GOOD: computed() — built once per new frame, free on mouse moves
panels = computed(() => … pointsOf(frames, p) …);
// ✅ GOOD: measured once (and on resize), read from a field
({ left, width } = this.box);
```

The hover index is a signal: setting the same index again changes nothing → nothing re-renders.

## Rules

- In a hot handler: no layout reads, no allocations you don't need, no heavy work.
- Make the template cheap to re-run: `computed()` everything expensive.
- Text input → search? Debounce: `debounced(() => this.query(), 300)` (Angular 22) or RxJS `debounceTime`.
- Visual-only effects (hover, animation) → CSS, not JavaScript.
