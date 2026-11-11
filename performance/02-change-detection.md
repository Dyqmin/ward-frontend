# Change detection: OnPush vs Eager

**Where:** whole nurse station. ❌ code: `*.eager.ts`, `main.ts`, `ward.routes.ts`.

Since Angular 22, **OnPush is the default**. A component re-runs its template only when:

- a signal it reads in the template changed,
- an input changed (by reference: `!==`),
- an event handler in its template ran,
- `markForCheck()` was called (an `async` pipe does this).

`ChangeDetectionStrategy.Eager` (formerly `Default`) re-checks a component **every time change
detection reaches it**, whether anything changed or not.

## See it

1. ⚡ Perf → check counters on. **Change detection** ❌. Watch the yellow badges: every tile, every second, ×6.
2. Panel → Template checks / s: **~430** (❌) vs **~30** (✅) with 18 beds. Try Stress ×10.
3. Angular DevTools → Profiler: in ❌ every run touches every `BedTile` and `VitalValue`.

Why ×15? One vitals tick for ONE bed starts a change detection run, and Eager makes it walk
through all 18 tiles and 54 values instead of just the one that changed.

## The code

```ts
// ❌ BAD: opts out of the default
@Component({ changeDetection: ChangeDetectionStrategy.Eager, … })

// ✅ GOOD: nothing to write — OnPush is the default. Feed the template signals.
```

Lint already catches it: `@angular-eslint/prefer-on-push-component-change-detection`.

## Rules

- Don't opt out of OnPush. If something "doesn't update", the fix is a signal, not Eager.
- With zoneless + OnPush + signals, Angular updates only the views that read what changed.
