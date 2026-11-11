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

## Fix 1 · the same listener, removed: use RxJS first

```ts
// ✅ the chart does this. fromEvent adds the listener on subscribe and removes it on unsubscribe;
// takeUntilDestroyed() unsubscribes when the component is destroyed.
fromEvent(window, 'resize').pipe(auditTime(100), takeUntilDestroyed()).subscribe(measure);
```

Why RxJS first: the cleanup is one operator that works for every source (events, timers, HTTP,
WebSocket). Throttling (`auditTime`), debouncing (`debounceTime`) and filtering come with it.
`toSignal(fromEvent(…))` cleans up the same way.

Without RxJS, two other options:

- **A host listener**, which Angular removes for you: `host: { '(window:resize)': 'measure()' }`.
- **Plain DOM**, if you have to:

  ```ts
  const listeners = new AbortController(); // one abort() removes every listener added with it
  window.addEventListener('resize', measure, { signal: listeners.signal });
  inject(DestroyRef).onDestroy(() => listeners.abort());
  ```

## Fix 2 · the same timer, cleared

```ts
// ✅ RxJS: the same rule, the same operator
interval(1000)
  .pipe(takeUntilDestroyed())
  .subscribe(() => this.take());

// ✅ plain: what the ⚡ Perf panel does (perf-panel.ts)
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

|            | `window` `'resize'`                                            | `ResizeObserver`                                                       |
| ---------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Fires when | the **viewport** changes size                                  | **this element** changes size, for any reason                          |
| Misses     | element changes (content, sidebar, `@defer`)                   | viewport changes that don't resize the element                         |
| On start   | nothing                                                        | fires once after `observe()`                                           |
| How often  | many times per drag (throttle it)                              | at most once per frame, after layout                                   |
| Gives you  | an `Event`; you measure yourself                               | the new size in the entry (`contentRect`, `borderBoxSize`)             |
| Clean up   | `fromEvent` + `takeUntilDestroyed()`, host listener, `abort()` | `disconnect()` (or `unobserve(el)`)                                    |
| Gotcha     | —                                                              | resizing the element inside the callback → "ResizeObserver loop" error |

## Rules

- Every `addEventListener`, `setInterval` and `observe` needs its matching remove, clear or
  disconnect.
- **Prefer RxJS:** `fromEvent(target, 'x')` or `interval(ms)`, then `.pipe(takeUntilDestroyed())`,
  or `toSignal(…)`. One rule for every source, with throttle and debounce built in.
- No RxJS? A host listener (`host: { '(window:resize)': … }`), or `{ signal }` + `abort()` in
  `DestroyRef.onDestroy`.
- Need to read layout after a render? `afterRenderEffect()`.
- Polling "in case it changed"? Use an observer that is told when it changes: `ResizeObserver`, `IntersectionObserver` or `MutationObserver`.
- Blinking or pulsing? Use a CSS animation. No timer at all.
