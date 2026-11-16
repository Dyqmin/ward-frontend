# Reading the charts

You don't read a flame chart top to bottom. You look for a **shape**, then zoom into it.

## The Performance panel in one minute

| Part                 | What it tells you                                                        |
| -------------------- | ------------------------------------------------------------------------ |
| Overview (top strip) | CPU per category: yellow script, purple layout/style, green paint        |
| **Main** track       | every task; x = time, width = duration, deeper = called by the one above |
| red corner on a task | long task, > 50 ms: input waits for it                                   |
| **Angular** track    | after `ng.enableProfiling()`: change detection, components, hooks        |
| Worker tracks        | work moved off the main thread (15, 16)                                  |
| **Bottom-Up**        | where time is really spent: sort by **Self Time**                        |
| **Call Tree**        | who caused it: top-down from the event                                   |
| Interactions track   | clicks and keys, with their delay (INP)                                  |

Select a range by dragging on the overview: every tab below shows only that range.

## Six shapes

| Shape                                       | Means                                             | In this app        |
| ------------------------------------------- | ------------------------------------------------- | ------------------ |
| **Picket fence**: many short, regular tasks | work per message or tick (often change detection) | 02, 03, 17         |
| **Wall**: one wide task, red corner         | a heavy calculation                               | 15                 |
| Purple right after yellow, "Forced reflow"  | layout thrashing: read after write                | 06                 |
| Many Minor GC                               | allocation churn: new arrays per message          | 13, 17             |
| Heap/DOM nodes: staircase                   | a leak                                            | 09, 11, 12, 13, 14 |
| Heap: sawtooth                              | healthy                                           | everything ✅      |

## Do

For each shape: switch its topic to ❌, record 5 s with CPU ×4, find the shape, then answer three
questions in one line each:

1. **What** is it (Bottom-Up, top Self Time)?
2. **Who** triggers it (Call Tree, or the Angular track)?
3. **What does it block** (a click in the Interactions track, frames, messages)?

## Rules

- Throttle the CPU. Your laptop is not the ward PC.
- Shape first, function names second.
- The Angular track turns "yellow script" into component names. Turn it on.
