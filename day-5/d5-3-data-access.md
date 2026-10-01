# D5.3 · The first library of the monitoring scope

**20 minutes**

`apps/ward/src/app/ward/` holds the core of the product: watching beds, vitals and alarms. In DDD
terms it is a bounded context. Its scope is called **monitoring** (not "ward": that is the
name of the app). You take it apart layer by layer over the next steps, starting with the code
that talks to the broker: the `data` folder.

## Steps

1. Create the library: folder `libs/monitoring/data-access`, project `monitoring-data-access`,
   tags `scope:monitoring,type:data-access`, import path `@wm/monitoring/data-access`. It is the
   only data-access library of its scope, so its folder has no name part.
2. Move the three files of `apps/ward/src/app/ward/data/` (`alarms-store.ts`,
   `alarms-store.spec.ts`, `patients-store.ts`) into `libs/monitoring/data-access/src/lib/`,
   directly, without a subfolder. Delete the empty `data` folder.
3. In the library's `src/index.ts`, export `alarms-store` and `patients-store` (not the spec).
4. Every file in the app that imported from `…/data/alarms-store` or `…/data/patients-store`
   now imports from `@wm/monitoring/data-access`. Search the `apps/ward` folder for
   `data/alarms-store` and `data/patients-store` to find them all (some import both: make it
   one import statement).

## Check

- `pnpm day5:check 3`
- `pnpm nx test monitoring-data-access`: the store's tests now run in the library (4 tests).
- `pnpm lint` passes.
- `pnpm start`: the nurse station shows its beds and alarms.

## Questions

1. In the graph, which projects import `monitoring-data-access`?
2. `patients-store.ts` came along because it was in the same folder. Is it about monitoring?
   Keep your answer: D5.9 comes back to it.
