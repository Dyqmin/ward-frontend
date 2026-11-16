# Angular performance cheat sheet

## Rendering

- **OnPush** is the default (Angular 22). Never opt out with `Eager` — use signals instead.
- **Zoneless** (default): change detection runs when a signal, input, event or `markForCheck` says so.
- Still on zone.js? Activate STOMP / WebSocket / timers in `runOutsideAngular()`, bring data back via signals.
- Every template expression runs on every check: methods, getters, inline `.filter()`, impure pipes.
- Derived state → `computed()`. Not getters, not methods, not `effect()` + `set()`.
- Per-row values in `@for` → a pure pipe (default). `pure: false` = a method.
- Inputs: stable references. `.map()` / `.filter()` in a template = a new array every check.
  (`{ a: x }` / `[x, y]` literals are memoized by the compiler: fine.)
- Methods in templates: only cheap ones that return primitives.
- `@let x = value();` — read once, use many times.
- `@for` → `track item.id`. Never identity on fresh objects (NG0956), `$index` only for static lists.
- Hot events (`pointermove`, `scroll`, `input`): no layout reads, cheap templates, debounce
  (`debounced()` / `debounceTime`), CSS for visual effects.
- Long lists: paginate, or `@angular/cdk/scrolling` virtual scroll, or CSS `content-visibility: auto`.
- Heavy computation: compute less often, then a cheaper algorithm, then a Web Worker (`ng g web-worker`).
- Worker: it owns its state. Send deltas, transfer `ArrayBuffer`s, `terminate()` on teardown.
- Socket bursts: latest value per frame (`auditTime(0, animationFrameScheduler)`), or `bufferTime` + one update.

## Loading

- Every route lazy (`loadComponent`, `loadChildren`). Preload with a strategy.
- `@defer (on viewport | interaction | hover | idle | timer | when …)`, with `prefetch on idle`.
- Lazy services: `injectAsync(() => import('./x'), { prefetch: onIdle })`.
- Budgets in `project.json`. Check `pnpm build:stats` in the esbuild analyzer.
- Avoid CommonJS and whole-library imports (`import _ from 'lodash'`).
- Images: `NgOptimizedImage` (`ngSrc`, `priority`, `sizes`, `placeholder`).
- SSR + hydration (incremental: `@defer (hydrate on …)`) for a fast first paint.

## RxJS

- Route param / id / search → `switchMap`. Never `subscribe()` inside `subscribe()`.
- Double-submit → `exhaustMap`. Ordered commands → `concatMap`. `mergeMap` only for real parallel work.
- `takeUntilDestroyed()` last in the pipe. `catchError` inside the inner pipe.
- One topic, one shared stream (root service + `shareReplay({ bufferSize: 1, refCount: true })`).

## Memory

| Holds a reference forever     | Release it with                                                           |
| ----------------------------- | ------------------------------------------------------------------------- |
| `subscribe()` to a stream     | `toSignal`, `rxResource`, `async` pipe, or `takeUntilDestroyed()`         |
| `addEventListener`            | `fromEvent(…).pipe(takeUntilDestroyed())`, host listener, `abort()`       |
| `setInterval` / observers     | `interval(…).pipe(takeUntilDestroyed())` / `clearInterval` / `disconnect` |
| root service + `this`         | unregister on destroy; better: expose signals                             |
| `Map` cache                   | limit (LRU/TTL), `WeakMap`, or a route/component-scoped service           |
| a live buffer (`scan`, store) | `.slice(-N)`: keep what the screen shows                                  |
| `shareReplay(1)`              | `shareReplay({ bufferSize: 1, refCount: true })`                          |
| `ReplaySubject()`             | a buffer size                                                             |

## Tools

| Want to know              | Use                                                               |
| ------------------------- | ----------------------------------------------------------------- |
| what re-renders           | Angular DevTools → Profiler                                       |
| what the main thread does | Performance panel (+ `ng.enableProfiling()` for an Angular track) |
| is something growing      | Performance monitor (heap, DOM nodes, listeners)                  |
| what leaks                | Heap snapshots: `Detached`, Comparison, Retainers                 |
| how many instances        | `queryObjects(MyComponent)` in the console                        |
| what users feel           | Lighthouse on a production build; field data (CrUX)               |

**Measure → change one thing → measure again.**
