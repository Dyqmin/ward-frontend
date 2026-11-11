# M2 · Timers and window listeners

**Where:** `vitals-chart.ts` constructor.

## See it

M2 ❌. Open 5 beds, go back.

- ⚡ Perf: **VitalsChart retained: 5** (BedDetail: 0 — only the chart leaks).
- Performance monitor: **JS event listeners** goes up by one per visit and never down.
- Heap snapshot → filter `Detached`: `Detached SVGSVGElement`, `Detached <polyline>`…
- Sources → set a breakpoint in `measure()`: it runs for charts that are long gone.

## Why

```ts
// ❌ BAD: `window` and the timer queue live forever, and hold `measure` → `this` → the SVG
window.addEventListener('resize', measure);
setInterval(measure, 1000);

// ✅ GOOD: watch our own element; stop when destroyed
const observer = new ResizeObserver(measure);
observer.observe(this.host);
inject(DestroyRef).onDestroy(() => observer.disconnect());
```

## Rules

- Every `addEventListener` / `setInterval` / `observe` needs its remove / clear / disconnect in
  `DestroyRef.onDestroy`.
- Better: let Angular own it.
  - `host: { '(window:resize)': 'measure()' }` — removed automatically.
  - `interval(1000).pipe(takeUntilDestroyed())` or `toSignal(interval(1000))`.
  - `afterRenderEffect()` for reading layout after render.
- Polling "in case it changed"? Use an observer (`ResizeObserver`, `IntersectionObserver`).
- Blinking, pulsing? CSS animation — no timer at all.
