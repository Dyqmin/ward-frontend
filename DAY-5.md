# Day 5 · From one app to a modular monolith

Today you take Ward Monitor apart into Nx libraries, the way the slides describe: one **scope**
per bounded context, one **type** per layer, and lint rules that fail the build when an import
crosses a line it should not cross. At the end:

- two apps, the ward app and the pharmacy team's app, share one design system;
- the ward app's own code lives in libraries, each with one job and one public entry point;
- `pnpm lint` reports every import that breaks the architecture.

You change the structure, not the behaviour: after every step the app works exactly as before.

**The instructions are in [`day-5/`](day-5/), one file per step.** This page tells you how to
start, where you are going, and the conventions every step uses.

## 1. Start

```sh
pnpm install
pnpm start            # the ward app:  http://localhost:4200
pnpm start:pharmacy   # the pharmacy:  http://localhost:4300
pnpm graph            # the project graph in the browser
```

`pnpm install` is needed once today: library tests run with Vitest through Analog, which is new.

The ward app works as on Day 4 (real broker, or `?mock` without one). The Day 2–4 exercise pages
(`/warmup`, `/streams`, `/state`) are gone from this branch: they live on their own branches.

## 2. Where you are going

The workspace at the end of the day. `→` means "imports".

```text
apps/
  ward/                      scope:ward        type:app      the Ward Monitor app (nurses, doctors)
  pharmacy/                  scope:pharmacy    type:app      another team's app
libs/
  monitoring/                the core: beds, vitals, alarms           D5.3–D5.8
    feature-station/         type:feature      pages and containers, the /ward routes
    data-access/             type:data-access  stores, route resources, the broker streams
    ui/                      type:ui           presentational components, inject nothing
    domain/                  type:domain       AlarmView and the alarm rules, plain TypeScript
  medication/                ordering medication                       D5.9
    feature-order/           type:feature      the order wizard
  patient/                   who lies in which bed                    D5.9
    data-access/             type:data-access  PatientsStore, patientResource
    api/                     type:api          the only part other scopes may import
  shared/                    used by everyone, owned jointly
    ui-design-system/        type:ui           Card, Badge, PageHeader, EmptyState, StatTile   D5.2
    domain/                  type:domain       the backend contract                ready-made
    util-dates/              type:util         clock()                             ready-made
    data-access-auth/        type:data-access  AuthStore, guards                   ready-made
    data-access-messaging/   type:data-access  MessageBus, provideStomp            ready-made
    data-access-logging/     type:data-access  Logger                              ready-made
    data-access-toasts/      type:data-access  Toasts                              ready-made
```

The six `ready-made` libraries are already there this morning: they show what a finished library
looks like (except for their tags, which you add in D5.5). Everything else you build.

## 3. The steps

| Step | File                                                 | What you do                                          | Lint after it        |
| ---- | ---------------------------------------------------- | ---------------------------------------------------- | -------------------- |
| D5.1 | [d5-1-graph.md](day-5/d5-1-graph.md)                 | read the graph, predict what a change affects        | passes               |
| D5.2 | [d5-2-design-system.md](day-5/d5-2-design-system.md) | one design system for both apps                      | passes               |
| D5.3 | [d5-3-data-access.md](day-5/d5-3-data-access.md)     | the first library of the monitoring scope            | passes               |
| D5.4 | [d5-4-ui.md](day-5/d5-4-ui.md)                       | the ward's `ui` folder becomes a library             | passes               |
| D5.5 | [d5-5-rules.md](day-5/d5-5-rules.md)                 | tags and rules: make the architecture fail the build | **fails on purpose** |
| D5.6 | [d5-6-domain.md](day-5/d5-6-domain.md)               | fix it the right way: a domain library               | still fails (less)   |
| D5.7 | [d5-7-container.md](day-5/d5-7-container.md)         | split a component that does everything               | passes               |
| D5.8 | [d5-8-feature.md](day-5/d5-8-feature.md)             | the pages become a feature library                   | passes               |
| D5.9 | [d5-9-medication.md](day-5/d5-9-medication.md)       | a second bounded context and a published API         | passes               |

Fell behind? Every step has a solution branch: `day-5-solution-1` … `day-5-solution-9` hold the
workspace after that step, and `day-5-solution` the end of the day. To continue from one:

```sh
git stash
git switch -c my-day-5 origin/day-5-solution-4
```

The answers to the questions at the end of each step are in `day-5/answers.md` on the
solution branches.

## 4. Conventions

### Names

| Thing                             | Convention                     | Example                                       |
| --------------------------------- | ------------------------------ | --------------------------------------------- |
| Folder                            | `libs/<scope>/<type>-<name>`   | `libs/monitoring/feature-station`             |
| Only one of its type in the scope | drop the name                  | `libs/monitoring/ui`                          |
| Project name                      | `<scope>-<type>-<name>`        | `monitoring-feature-station`, `monitoring-ui` |
| Import path                       | `@wm/<scope>/<type>-<name>`    | `@wm/monitoring/ui`                           |
| Tags                              | `scope:<scope>`, `type:<type>` | `scope:monitoring`, `type:ui`                 |
| Selector prefix in libraries      | `wm-`                          | `wm-bed-tile`                                 |
| Selector prefix in the ward app   | `app-` (unchanged)             | `app-root`                                    |

### Creating a library

Every library of the day is created by the same command. Fill in the four places, run it with
`--dry-run` first, read the list of files it would create, then run it again without
`--dry-run`:

```sh
pnpm nx g @nx/angular:library libs/<scope>/<folder> --name=<project name> --tags=scope:<scope>,type:<type> --importPath=@wm/<scope>/<folder> --prefix=wm --standalone=false --skipModule --dry-run
```

- `--standalone=false --skipModule` only stop the generator from creating a sample component:
  your library starts empty, with an empty `src/index.ts`.
- The generator adds the import path to `tsconfig.base.json` and the tags to the library's
  `project.json`.
- Ignore the yellow note about a deprecated `@nx/eslint:lint` executor: it is meant for the Nx
  team, not for you.

### Moving code into a library

1. **Move the files.** Drag them in VS Code's Explorer, or use `git mv`. When VS Code asks
   whether to update the imports, say yes, then look at what it wrote (step 3).
2. **Export them** from the library's `src/index.ts`: one `export * from './lib/…';` line per
   file that others use. `index.ts` is the library's contract; whatever it does not export stays
   private.
3. **Fix the imports.**
   - Inside one library: relative paths (`./`, `../`).
   - Into another library: always its import path, e.g. `@wm/monitoring/ui`. Never a relative
     path into another project (`../../../../libs/…`): lint reports it.
   - Red squiggles in the editor, or `pnpm nx build ward`, list what is left to fix.
4. **Rename the selectors** of components that move into a library from `app-…` to `wm-…`, and
   the tags in the templates that use them.

## 5. Checking your work

After every step:

```sh
pnpm day5:check <step>   # e.g. pnpm day5:check 3
pnpm lint
```

- `day5:check` compares your workspace with the solution of that step: projects, tags, import
  paths, which file lives where, what each `index.ts` re-exports, the lint rules. It tells you
  what differs. It also prints what `pnpm lint` should say after that step.
- `pnpm lint` runs ESLint in every project. From D5.5 on, it is how the architecture is checked.
- `pnpm test` runs every project's tests; `pnpm nx test <project>` runs one.
- Then click through the app: nothing may have changed for the user.

## 6. Two rules for the whole day

1. **Never fix a lint error by relaxing a rule** or by adding an exception to `allow`. Change the
   code: move it to the right library. `day5:check` fails if the rules are weakened.
2. **Import a library only through its import path** (`@wm/…`), never a file inside it.
