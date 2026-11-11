# P3 · `@for` and `track`

**Where:** nurse station → Active alarms. `alarmsCopied` and `@for (… track a)`.

`track` tells Angular which item is which between two renders. Same key = keep the DOM and the
component; new key = destroy and create.

## See it

P3 ❌, wait for an alarm (or Acknowledge one).

- Console: **NG0956** — "tracking expression caused re-creation of the entire collection".
- Elements panel: the whole alarm list flashes on every change.
- Acknowledge an alarm: the "pending sync…" chip can vanish — its component was destroyed.

## Why

```ts
// ❌ BAD: fresh objects (spread, JSON.parse, a store that copies) + track by identity
alarmsCopied = computed(() => this.alarms().map((a) => ({ ...a })));
@for (a of alarmsCopied(); track a)          // no object is ever the same → all rows re-created

// ✅ GOOD: a stable, unique id
@for (a of alarms(); track a.event.alarmId)
```

## Rules

- Always track by a **unique, stable id**.
- `track $index` only for static lists that never reorder — with reordering, component state
  (pending, focus, open menus) jumps to the wrong row.
- Duplicate keys → NG0955 in the console. Fix the data.
