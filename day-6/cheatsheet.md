# Angular performance cheat sheet

## Rendering

- **OnPush** is the default (Angular 22). Never opt out with `Eager` — use signals instead.
- **Zoneless** (default): change detection runs when a signal, input, event or `markForCheck` says so.
- Derived state → `computed()`. Not methods, not `effect()` + `set()`.
- Inputs: stable references. No `[]`, `{}`, `.map()`, `.filter()` built in the template.
- Methods in templates: only cheap ones that return primitives. Formatting → pure pipe.
- `@let x = expensive();` — call once, use many times.
- `@for` → `track item.id`. Never identity on fresh objects (NG0956), `$index` only for static lists.
- Hot events (`pointermove`, `scroll`, `input`): no layout reads, cheap templates, debounce
  (`debounced()` / `debounceTime`), CSS for visual effects.
- Long lists: paginate, or `@angular/cdk/scrolling` virtual scroll, or CSS `content-visibility: auto`.
- Heavy computation: a Web Worker (`ng g web-worker`).

## Loading

- Every route lazy (`loadComponent`, `loadChildren`). Preload with a strategy.
- `@defer (on viewport | interaction | hover | idle | timer | when …)`, with `prefetch on idle`.
- Lazy services: `injectAsync(() => import('./x'), { prefetch: onIdle })`.
- Budgets in `project.json`. Check `pnpm build:stats` in the esbuild analyzer.
- Avoid CommonJS and whole-library imports (`import _ from 'lodash'`).
- Images: `NgOptimizedImage` (`ngSrc`, `priority`, `sizes`, `placeholder`).
- SSR + hydration (incremental: `@defer (hydrate on …)`) for a fast first paint.

## Memory

| Holds a reference forever | Release it with                                                   |
| ------------------------- | ----------------------------------------------------------------- |
| `subscribe()` to a stream | `toSignal`, `rxResource`, `async` pipe, or `takeUntilDestroyed()` |
| `addEventListener`        | `host: { '(window:x)': … }`, or `removeEventListener` on destroy  |
| `setInterval` / observers | `clearInterval` / `disconnect` in `DestroyRef.onDestroy`          |
| root service + `this`     | unregister on destroy; better: expose signals                     |
| `Map` cache               | limit (LRU/TTL), `WeakMap`, or a route/component-scoped service   |
| `shareReplay(1)`          | `shareReplay({ bufferSize: 1, refCount: true })`                  |
| `ReplaySubject()`         | a buffer size                                                     |

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
