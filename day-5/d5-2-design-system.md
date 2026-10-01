# D5.2 · One design system for both apps

**35 minutes**

The pharmacy team builds `apps/pharmacy`, in the same monorepo. They liked the ward's cards and
badges, so they copied the markup and the styles by hand: see `apps/pharmacy/src/app/app.html`
and `app.scss`. Two copies of the same thing drift apart with every change.

The ward app keeps four small components in `apps/ward/src/app/ui-kit/`: **Card**, **Badge**,
**EmptyState** and **PageHeader**. They have no domain word in their names, they inject nothing,
and they mean the same thing in both apps. That makes them shared code: a `ui` library in the
`shared` scope, which any app of any team in this monorepo may use.

## Steps

### The library

1. Create the library with the command from [DAY-5.md](../DAY-5.md#creating-a-library):
   folder `libs/shared/ui-design-system`, project `shared-ui-design-system`, tags
   `scope:shared,type:ui`, import path `@wm/shared/ui-design-system`. Dry run first.
2. Move the four folders `card`, `badge`, `empty-state` and `page-header` from
   `apps/ward/src/app/ui-kit/` into `libs/shared/ui-design-system/src/lib/`, one folder per
   component, as they are. Delete the empty `ui-kit` folder.
3. In each of the four components, change the selector from `app-…` to `wm-…`: `wm-card`,
   `wm-badge`, `wm-empty-state`, `wm-page-header`. Also update the usage examples in the
   comments above `Card` and `Badge`.
4. In `libs/shared/ui-design-system/src/index.ts`, export the four component files, one
   `export *` line each. (`badge.ts` also exports the type `BadgeTone`; `export *` takes it
   along.)

### The ward app uses it

5. In `nurse-station.ts` and `ward-rounds.ts` (in `apps/ward/src/app/ward/`), import the
   components from `@wm/shared/ui-design-system`, in one import statement per file, instead of
   from `../../ui-kit/…`.
6. In `nurse-station.html` and `ward-rounds.html`, rename the tags from `app-…` to `wm-…`
   (opening and closing tags).

### A fifth component, made by the generator

The pharmacy shows two numbers in tiles ("To prepare", "Prepared today"). The ward has no such
component yet, so create it directly in the design system:

7. Run (dry run first):

   ```sh
   pnpm nx g @nx/angular:component libs/shared/ui-design-system/src/lib/stat-tile/stat-tile --export --skipTests --dry-run
   ```

   `--export` adds the new file to `index.ts` for you. The selector becomes `wm-stat-tile`
   because the library's prefix is `wm`.

8. In `stat-tile.ts`, give the component `StatTile` three signal inputs:
   - `label`: required, type `string`;
   - `value`: required, type `string | number`;
   - `unit`: optional, default value `''` (empty string).
9. In `stat-tile.html`, replace the generated paragraph with:
   - a `span` with the class `label`, showing the label;
   - a `span` with the class `value`, showing the value, and inside it, after the value and
     only when there is a unit, a `span` with the class `unit` showing the unit.
10. In `stat-tile.scss`: cut the `.stat { … }` block out of `apps/pharmacy/src/app/app.scss` and
    paste it here, then change `.stat` to `:host`. (The tile is the component's own element.)

### The pharmacy uses it

11. In `apps/pharmacy/src/app/app.html`, replace the hand-made parts with the components:
    - the `header class="page-header"` → `wm-page-header` with the inputs `heading`
      ("Pharmacy desk") and `subtitle` (the text of the paragraph);
    - each `div class="stat"` → `wm-stat-tile` with `label` and `value` (keep the two values);
    - the `section class="card"` → `wm-card` with the input `heading` ("Orders to prepare"); the
      `header` inside it goes away;
    - the `span class="badge"` → `wm-badge` with the input `tone` set to `warn` and the
      attribute `cardAside` (that puts it next to the card's heading); keep its `@if`;
    - the paragraph `class="empty"` → `wm-empty-state` with the input `message`.
12. In `app.ts`, import `Badge`, `Card`, `EmptyState`, `PageHeader` and `StatTile` from
    `@wm/shared/ui-design-system`, add them to the component's `imports`, and update the comment
    above `App`: nothing is copied by hand any more.
13. In `app.scss`, delete every rule except `.stats` and `.order`.

## Check

- `pnpm day5:check 2`
- `pnpm lint` passes.
- `pnpm graph`: both apps now point at `shared-ui-design-system`.
- `pnpm nx show projects --affected --files=libs/shared/ui-design-system/src/lib/card/card.ts`
  lists both apps.
- `pnpm start` and `pnpm start:pharmacy`: the nurse station looks as before; the pharmacy shows
  the same components in its own, light theme.

## Questions

1. The pharmacy is light, the ward is dark, and they use the same `Card`. How? (Look at
   `card.scss`.)
2. `BedTile` (in `apps/ward/src/app/ward/ui/`) is also a small presentational component. Why
   does it not go into the design system?
3. Who should review a change to `shared-ui-design-system` now?

**Stretch:** give the design system an owner: create `.github/CODEOWNERS` with a line that
assigns `libs/shared/ui-design-system/` to a team of your choice.
