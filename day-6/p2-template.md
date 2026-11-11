# P2 · Work in templates

**Where:** `nurse-station.ts` / `.html` → `alarmsOf(bed)` vs `alarmsFor()`.

The nurse station shows a shift clock, so the page itself re-renders every second. That is fine,
**as long as its children don't have to**.

## See it

P2 ❌, counters on. The `BedTile` badges climb twice as fast: **36/s instead of 18/s**. Stress ×10
makes it 360.

## Why

```html
<!-- ❌ BAD: runs on every check, returns a NEW array every time -->
<app-bed-tile [alarms]="alarmsOf(bed)" />

<!-- ✅ GOOD: computed once per alarm change; same array → input unchanged → tile skipped -->
<app-bed-tile [alarms]="alarmsFor()(bed)" />
```

A new array is a new input value (`!==`), so OnPush can't skip the tile. The method also filters
every alarm for every tile on every check.

## Rules

- Derived data goes in `computed()`. It runs once per change, not once per check.
- Inputs: pass **stable references**. `[]`, `{…}`, `.map()`, `.filter()` in a template = new every time.
- Methods in templates are fine when **cheap and returning primitives** (`patients.patient(bed)`).
- Formatting? A **pure pipe** runs only when its input changes.
- Need it once per render? `@let x = expensive();` instead of calling it three times.
