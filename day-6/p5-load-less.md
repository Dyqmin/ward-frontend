# P5 · Load less: lazy routes, `@defer`, bundles

The fastest code is code the user never downloads.

## See it

```sh
pnpm build         # ✅ app.routes.ts: loadComponent / loadChildren
pnpm build:eager   # ❌ app.routes.eager.ts: every page imported up front
```

Compare **Initial total**: ~368 kB vs ~397 kB. Every page you make eager moves into it. Look at
the lazy chunk list: `login`, `monitor-simulator`, `vitals-chart`, `perf-panel`, …

`pnpm build:stats` → drop `dist/apps/ward/browser-stats.json` on <https://esbuild.github.io/analyze/>.
What is the biggest thing in the initial bundle?

## The code

```ts
// ❌ BAD: imported = in the main bundle
{ path: 'login', component: Login }
// ✅ GOOD: its own chunk, loaded on navigation
{ path: 'login', loadComponent: () => import('./auth/login') }
```

```html
<!-- ✅ GOOD: bed-detail.html — the chart is its own chunk, fetched when idle, shown in view -->
@defer (on viewport; prefetch on idle) {
<app-vitals-chart … />
} @placeholder { <ngx-skeleton-loader count="3" /> }

<!-- ✅ GOOD: app.html — a dev tool nobody needs for the first paint -->
@defer (on idle) { <app-perf-panel /> }
```

`@defer` only splits a component that is used **nowhere else** outside `@defer` in that file.
With `pnpm start` (HMR) deferred blocks load eagerly — see the Network tab with `pnpm serve:prod`.

## Rules

- Every route lazy. Preload smart (`withPreloading(...)`, see `WifiAwarePreloading`).
- `@defer` below the fold, behind interaction (`on interaction`, `on hover`), or rare (`when`).
- Lazy services too: `injectAsync(() => import('./pdf-export'), { prefetch: onIdle })` (Angular 22).
- Keep budgets in `project.json` — the build fails when the bundle grows.
- Images: `NgOptimizedImage` (`ngSrc`, `priority` for the LCP image, sizes).
