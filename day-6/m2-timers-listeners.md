# M2 · Timers and window listeners

**Where:** the `vitals-chart.ts` constructor.

## See it

Set M2 ❌, open 5 beds, then go back.

- **⚡ Perf** shows **VitalsChart retained: 5**. BedDetail stays at 0: only the chart leaks.
- **Performance monitor:** JS event listeners goes up by one per visit and never comes back down.
- **Heap snapshot**, filtered by `Detached`: you'll find `Detached SVGSVGElement`, `Detached <polyline>` and so on.
- **Sources:** put a breakpoint in `measure()`. It keeps running for charts that are long gone.

## Why

`window` and the timer queue live as long as the page. They keep the callback alive, the callback
keeps `this`, and `this` keeps the SVG.

```ts
// ❌ BAD
window.addEventListener('resize', measure);
setInterval(measure, 1000);
```

## Fix 1 · the same listener, removed

```ts
// ✅ one AbortController removes every listener added with its signal
const listeners = new AbortController();
window.addEventListener('resize', measure, { signal: listeners.signal });
inject(DestroyRef).onDestroy(() => listeners.abort());
```

Simpler still is a host listener, which Angular removes for you:
`host: { '(window:resize)': 'measure()' }`.

## Fix 2 · the same timer, cleared

```ts
// ✅ the ⚡ Perf panel does exactly this: perf-panel.ts
const id = setInterval(() => this.take(), 1000);
inject(DestroyRef).onDestroy(() => clearInterval(id));
```

The chart's timer, though, polls "in case the layout changed". Clearing it fixes the leak, but the
chart still polls. **A `ResizeObserver` replaces the poll:**

```ts
const observer = new ResizeObserver(measure);
observer.observe(this.host);
inject(DestroyRef).onDestroy(() => observer.disconnect());
```

## `resize` listener vs `ResizeObserver`

They are not two ways to do the same thing. The chart uses **both**.

|            | `window` `'resize'`                                  | `ResizeObserver`                                                       |
| ---------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Fires when | the **viewport** changes size                        | **this element** changes size, for any reason                          |
| Misses     | element changes (content, sidebar, `@defer`)         | viewport changes that don't resize the element                         |
| On start   | nothing                                              | fires once after `observe()`                                           |
| How often  | many times per drag (throttle it)                    | at most once per frame, after layout                                   |
| Gives you  | an `Event`; you measure yourself                     | the new size in the entry (`contentRect`, `borderBoxSize`)             |
| Clean up   | `removeEventListener`, `abort()`, or a host listener | `disconnect()` (or `unobserve(el)`)                                    |
| Gotcha     | —                                                    | resizing the element inside the callback → "ResizeObserver loop" error |

## Rules

- Every `addEventListener`, `setInterval` and `observe` needs its matching remove, clear or
  disconnect in `DestroyRef.onDestroy`.
- Even better, let Angular own it:
  - `host: { '(window:resize)': … }` for global events;
  - `interval(1000).pipe(takeUntilDestroyed())` or `toSignal(interval(1000))` for timers;
  - `afterRenderEffect()` to read layout after a render.
- Polling "in case it changed"? Use an observer that is told when it changes: `ResizeObserver`, `IntersectionObserver` or `MutationObserver`.
- Blinking or pulsing? Use a CSS animation. No timer at all.
