# D5.4 · The ward's ui folder becomes a library

**15 minutes**

Next layer: `apps/ward/src/app/ward/ui/`. The folder is called `ui`, so it goes into the
monitoring scope's `ui` library, as it is.

## Steps

1. Create the library: folder `libs/monitoring/ui`, project `monitoring-ui`, tags
   `scope:monitoring,type:ui`, import path `@wm/monitoring/ui`.
2. Move the content of `apps/ward/src/app/ward/ui/` into `libs/monitoring/ui/src/lib/`:
   - `alarm-actions.ts`, `.html` and `.scss` into a new folder `alarm-actions/`;
   - `bed-tile.ts`, `.html` and `.scss` into a new folder `bed-tile/`;
   - `format.ts` directly into `lib/`.

   Delete the empty `ui` folder.

3. Fix the imports inside the library: `alarm-actions.ts` imports `format` one folder up now
   (`../format`). Their `AlarmView` import from `@wm/monitoring/data-access` stays as you wrote
   it in D5.3.
4. Rename the selectors: `app-alarm-actions` → `wm-alarm-actions`, `app-bed-tile` →
   `wm-bed-tile`. Update the tags in `nurse-station.html`, `ward-rounds.html` and
   `bed-detail.html`.
5. In the library's `src/index.ts`, export `alarm-actions`, `bed-tile` and `format`.
6. Every file in the app that imported from `…/ui/format`, `…/ui/alarm-actions` or
   `…/ui/bed-tile` now imports from `@wm/monitoring/ui`. Search `apps/ward` for `ui/format`,
   `ui/alarm-actions` and `ui/bed-tile` to find them. (Leave `core/ui/…` alone: the connection
   badge and the toast outlet belong to the app.)

## Check

- `pnpm day5:check 4`
- `pnpm lint` passes: there are no rules yet.
- `pnpm start`: alarms and bed tiles look as before.

## Questions

1. A `ui` library should hold presentational components only: they get data through inputs,
   report clicks through outputs, and inject nothing. Open `alarm-actions.ts` and `format.ts`
   in the library and look at what they import. Is everything in `monitoring-ui`
   presentational?
2. Nothing complained. What would have to exist for this move to fail?
