# M0 · Finding leaks

A leak = something you are done with that is still reachable, so the garbage collector can't free
it. In Angular it is almost always: **something long-lived holds a reference to something
short-lived** (a component, its DOM, a closure over `this`).

```text
long-lived (window, a timer, a root service, an open stream)
   └─ holds a callback / a Set / a Map
        └─ which holds `this` (a destroyed component)
             └─ which holds its DOM  →  "Detached" nodes
```

## The tools

| Tool                                                    | Shows                                                                              |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **⚡ Perf** → Live subscriptions, Components "retained" | the quick suspicion                                                                |
| **Performance monitor**                                 | JS heap, DOM nodes, JS event listeners — a sawtooth is fine, a staircase is a leak |
| **Memory → Heap snapshot** → filter `Detached`          | DOM no longer on the page but still in memory                                      |
| **Memory → Heap snapshot → Comparison**                 | what was created between two snapshots and is still there                          |
| **Retainers** pane (bottom)                             | **who** keeps an object alive — read it bottom-up                                  |
| **Memory → Allocations on timeline**                    | blue bars that stay blue = never freed                                             |
| Console: `queryObjects(BedDetail)`                      | live instances of a class (dev build keeps names)                                  |

## The 3-snapshot technique

1. Open the ward. **🗑 GC, snapshot 1.**
2. Do the action 5× (open a bed, go back).
3. **🗑 GC, snapshot 2.** Do it 5× more. **🗑 GC, snapshot 3.**
4. Snapshot 3 → "Objects allocated between 1 and 2". Whatever is still there grew with the action.
   Count of 5 or 10? That's your leak. Click it → Retainers → find your code in the chain.

## Do

Switch all M topics to ❌. Visit five beds. Before reading M1–M5, find with the tools:
which components are retained, and what holds them?
