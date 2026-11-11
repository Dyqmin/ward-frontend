# Angular performance checklist

Every tip in one place. Items with a **→** link have a note, and most notes come with a live ❌/✅ demo
in this app. The course order is in [PERFORMANCE.md](../PERFORMANCE.md), and the one-page version is
[cheatsheet.md](cheatsheet.md).

## Change detection

- **Go zoneless.** Without ZoneJS, change detection runs only when a signal or an event says
  something changed. It is the default for new apps since v21.
  → [Change detection](02-change-detection.md)
- **Use OnPush everywhere.** It is the default since v22, and the old "Default" strategy is now called
  `Eager`. For legacy apps, moving everything to OnPush while still on zone.js is a good step toward
  zoneless. → [Change detection](02-change-detection.md)
- **Keep inputs immutable.** Inputs are compared with `Object.is`. Mutate an object but keep its
  reference, and no check runs. A new reference on every check means a check every time.
  → [Computation in templates](03-template-computation.md)
- **Don't call methods or getters in templates.** Every template expression runs on every check, so one
  slow expression slows everything. Use `computed()` or a pure pipe.
  → [Computation in templates](03-template-computation.md)
- **Cache with pure pipes or memoization.** A pure pipe re-runs only when its inputs change.
  Memoization can store several results, but it costs memory.
  → [Computation in templates](03-template-computation.md)
- **Keep lifecycle hooks light.** `ngDoCheck`, `ngAfterContentChecked`, `ngAfterViewChecked` and
  `ngOnChanges` run on every cycle. Don't force reflows or repaints in them.
- **Use `afterNextRender` / `afterRenderEffect` for DOM reads and writes.** Their read and write phases
  prevent layout thrashing. → [Hot events](05-hot-events.md),
  [Timers and window listeners](09-listeners-timers.md)
- **Prefer `markForCheck()` over `detectChanges()`, and signals over both.**
  → [Change detection](02-change-detection.md)
- **Split big components into small ones**, so a state change dirties only a small view.
- **Zone-based apps: fix zone pollution.** Run timers and third-party setup (charts, maps) in
  `ngZone.runOutsideAngular()`, and re-enter the zone only when the view needs an update.
- **Zone-based apps: turn on event coalescing.** Use `provideZoneChangeDetection({ eventCoalescing: true })`.

## Signals

- **Derive state with `computed()`**, which is lazy and memoized. Don't copy state in an `effect()`.
  → [Computation in templates](03-template-computation.md)
- **Use effects for side effects only** (logging, storage, imperative DOM). Use `untracked()` to avoid
  accidental dependencies. → [Forgotten subscribe()](08-forgotten-subscribe.md)
- **Use `linkedSignal`** for derived state that can be reset, instead of syncing it with an effect.
- **Use signal inputs, `model()` and signal queries** (`viewChild`, `contentChild`), so change
  detection can target only the views that read them.
- **Pass a custom `equal` function to signals that hold objects**, so downstream code doesn't
  recompute for nothing.
- **Keep signals granular.** Several small signals beat one big state object that invalidates
  everything.
- **Use `resource` / `httpResource` / `rxResource` for async data.** They are stable in v22, and
  `chain()` lets one resource feed another without `switchMap` + `toSignal`.
  → [Forgotten subscribe()](08-forgotten-subscribe.md)
- **Try `debounced()` for search inputs.** It is still experimental. → [Hot events](05-hot-events.md)

## Templates and rendering

- **Use the built-in control flow** (`@if`, `@for`, `@switch`) instead of structural directives. It is
  faster and needs no imports.
- **Give `@for` a stable, unique `track`**: an id. Not the object, and not `$index` for dynamic lists.
  → [@for and track](04-for-track.md)
- **Virtualize long lists** with CDK virtual scroll, or paginate.
  → [Live buffer that only grows](11-growing-buffer.md), [cheatsheet](cheatsheet.md)
- **Prefer `@if` over `[hidden]` for heavy subtrees**, so they aren't created at all.
- **Use `@let`** so a template doesn't evaluate the same expression several times.
  → [Computation in templates](03-template-computation.md)
- **Throttle high-frequency events** (scroll, mousemove, resize), and use passive listeners.
  → [Hot events](05-hot-events.md), [Timers and window listeners](09-listeners-timers.md)
- **Use native CSS animations** or `animate.enter` / `animate.leave` instead of the legacy animations
  package, which adds bundle weight. → [Hot events](05-hot-events.md)
- **Use CSS `content-visibility` and `contain`** for large off-screen sections.
  → [cheatsheet](cheatsheet.md)
- **Move CPU-heavy work to Web Workers** (`ng generate web-worker`). → [cheatsheet](cheatsheet.md)

## Loading and bundle size

- **Lazy-load routes** with `loadComponent` / `loadChildren`. → [Load less](06-lazy-loading.md)
- **Use `@defer`** for components that aren't visible on first render, heavy libraries and
  below-the-fold content. Pick the trigger on purpose (`on viewport`, `on interaction`, `on idle`,
  `on timer`, `when`), and add `prefetch`. → [Load less](06-lazy-loading.md)
- **Give `@placeholder` fixed dimensions and a minimum time**, so there is no layout shift or flicker.
  → [Load less](06-lazy-loading.md)
- **Lazy-load services with `injectAsync`.** Rarely used services, or services backed by big
  libraries, get their own chunks. → [Load less](06-lazy-loading.md)
- **Choose a preloading strategy** (`withPreloading(PreloadAllModules)` or a custom one), so lazy chunks
  are ready before the user navigates. → [Load less](06-lazy-loading.md)
- **Use standalone components**, and avoid shared "barrel" modules that drag in unused code.
- **Use `providedIn: 'root'`** (tree-shakable) or route-level providers, not eager module providers.
- **Use the esbuild/Vite application builder**, and keep production optimizations on.
- **Set bundle budgets** and fail CI when they're exceeded. → [Load less](06-lazy-loading.md)
- **Analyze bundles** with the esbuild stats analyzer or source-map-explorer.
  → [Measure first](01-measure.md), [Load less](06-lazy-loading.md)
- **Audit dependencies.** Import only what you use (`date-fns` over `moment`, `lodash-es` per
  function), and avoid CommonJS packages, which block tree-shaking. → [cheatsheet](cheatsheet.md)
- **Inline critical CSS and fonts** (the CLI default), self-host fonts, and use `font-display: swap`.
- **Drop `zone.js` from polyfills** once you're zoneless.
- **Serve with Brotli and HTTP/2 or 3**, and cache hashed assets for a long time through a CDN.
- **Add a service worker** (`@angular/pwa`) for repeat-visit caching.
- **Load third-party scripts lazily** (analytics, chat widgets), or move them to a worker.

## Images

- **Use `NgOptimizedImage` (`ngSrc`).** It prioritizes the LCP image, lazy-loads the rest and
  generates responsive `srcset`s. → [Load less](06-lazy-loading.md)
- **Mark the LCP image `priority`**, and always set `width`/`height` or `fill` to prevent layout shift.
  → [Load less](06-lazy-loading.md)
- **Configure an image loader or CDN**, use `sizes`, serve AVIF/WebP, and `preconnect` to the image
  origin.
- **Use `placeholder` (blur-up)** for large images.

## SSR and hydration

- **Use SSR or prerendering for content-heavy pages**, for a faster first paint and better SEO. Set
  the render mode per route (server, prerender, client).
- **Turn on hydration** (`provideClientHydration()`), so the DOM is reused instead of re-rendered.
  → [cheatsheet](cheatsheet.md)
- **Use incremental hydration.** `@defer` accepts `hydrate on idle | viewport | interaction | hover |
timer | immediate`, `hydrate when` and `hydrate never`. Use `hydrate never` for static sections.
  → [cheatsheet](cheatsheet.md)
- **Rely on event replay.** Incremental hydration turns it on, so clicks before hydration aren't lost.
- **Keep the HTTP transfer cache on**, so the client doesn't refetch what the server already fetched.
- **Avoid direct DOM access and browser-only globals during render.** They break hydration and force
  a re-render.

## RxJS

- **Never nest subscriptions.** A `subscribe()` inside a `subscribe()` can't be cancelled. Use a
  flattening operator.
- **Pick the right flattening operator.**
  - `switchMap` for search and navigation: it cancels stale requests.
  - `exhaustMap` for form submits.
  - `concatMap` for ordered writes.
  - `mergeMap` only when you want parallelism. On a typeahead it causes race conditions.
- **Always clean up.** Use the `async` pipe, `toSignal`, or `takeUntilDestroyed()`.
  → [Forgotten subscribe()](08-forgotten-subscribe.md),
  [Timers and window listeners](09-listeners-timers.md)
- **Put `takeUntilDestroyed` last in the pipe**, so it also tears down inner observables.
- **Share expensive sources** with `shareReplay({ bufferSize: 1, refCount: true })`. Without
  `refCount`, the source subscription outlives its consumers and leaks.
  → [shareReplay without refCount](12-share-replay.md)
- **Avoid several `async` pipes on the same cold observable**, because each one subscribes again. Use
  one `@if (x$ | async; as x)`, or convert it to a signal.
- **Debounce user input** with `debounceTime()` + `distinctUntilChanged()`.
  → [Hot events](05-hot-events.md)
- **Rate-limit event streams.**
  - `throttleTime` / `auditTime` for scroll and resize.
  - `animationFrameScheduler` for visual updates.
  - `bufferTime` to batch WebSocket bursts.

  → [Timers and window listeners](09-listeners-timers.md)

- **Filter early, map late.** Put `filter`, `distinctUntilChanged` and `take` before expensive
  operators.
- **Handle errors inside the inner observable.** A `catchError` inside the `switchMap` keeps the
  outer stream alive.
- **Use `forkJoin` for parallel one-shot requests**, and `combineLatest` only when you need live
  recombination.
- **Use `distinctUntilChanged`** with a comparator, or `distinctUntilKeyChanged`, on store selectors
  to cut emissions.
- **Call `toSignal` once and share the result.** It subscribes immediately, so calling it repeatedly
  multiplies subscriptions.
- **Use signals for state and RxJS for events.** Signals hold synchronous view state. RxJS handles
  time and events (debounce, retry, cancellation, WebSockets). Bridge them with `toSignal`,
  `toObservable` and `rxResource`.
- **Don't expose Subjects.** Expose `asObservable()` or read-only signals.
- **Use `take(1)` / `first()` for one-shot reads**, and `finalize` for cleanup.

## HTTP and data

- **Cache responses** (shared observables, resources, or a caching interceptor) and dedupe in-flight
  requests. → [shareReplay without refCount](12-share-replay.md)
- **Cancel stale requests** with `switchMap` or resource reloads.
- **Paginate, and request only the fields you need.** Large payloads cost parse and render time.
- **Use functional interceptors and keep them cheap**, because they run on every request.
- **HttpClient uses the Fetch API by default in v22**, which also helps SSR.
- **Avoid blocking route resolvers for non-critical data.** Render the shell, and load data with
  resources or `@defer`.
- **Normalize state in stores** (NgRx SignalStore or similar), and select narrowly.

## Forms

- **Don't subscribe to `valueChanges` on huge forms without debouncing.** Use `updateOn: 'blur'` or
  `'submit'` for expensive validators.
- **Debounce async validators.**
- **Consider Signal Forms.** They are stable in v22 and work with fine-grained change detection.

## Memory

- **Find leaks with the tools.** Watch for detached DOM nodes and growing heaps in Chrome's Memory
  tab. → [Finding leaks](07-find-leaks.md)
- **End every subscription to a stream.** → [Forgotten subscribe()](08-forgotten-subscribe.md)
- **Remove manual listeners, timers and observers in `DestroyRef.onDestroy`**, or let RxJS do it.
  → [Timers and window listeners](09-listeners-timers.md)
- **Don't let a root service keep components.** Unregister on destroy, or expose signals instead.
  → [Root service keeps components](10-root-service.md)
- **Give every buffer and cache a limit**: live streams, logs, `ReplaySubject()`, `Map` caches.
  → [Live buffer that only grows](11-growing-buffer.md)
- **Use `refCount: true` on shared long-lived streams.**
  → [shareReplay without refCount](12-share-replay.md)
- **Destroy third-party instances** (charts, maps, editors) when the component is destroyed.

## Measure first

- **Profile before optimizing.**
  - The Chrome DevTools Angular track shows rendering, change detection cycles and lifecycle hooks in
    flame charts.
  - The Angular DevTools profiler shows change detection cycles.

  → [Measure first](01-measure.md)

- **Track Core Web Vitals** (LCP, INP, CLS) with Lighthouse, WebPageTest and real-user monitoring.
  → [Measure first](01-measure.md)
- **Add Lighthouse CI and bundle budgets to the pipeline** to catch regressions.
  → [Load less](06-lazy-loading.md)
- **Keep Angular up to date.** Each major version brings performance improvements and automated
  migrations (control flow, signal inputs, OnPush, zoneless).
