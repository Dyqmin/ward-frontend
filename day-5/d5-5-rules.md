# D5.5 · Tags and rules: make the architecture fail the build

**25 minutes**

So far the architecture is a folder convention: anybody can import anything, and nothing
complains. Two pieces make it a rule the build enforces:

- **tags**: every project gets exactly one `scope:` (which bounded context) and one `type:`
  (which layer). A project without tags escapes every rule that names a tag.
- **`depConstraints`** in `eslint.config.mjs`: for each tag, the tags it may import.
  `@nx/enforce-module-boundaries` checks every `import` against them.

## Steps

### Tag every project

1. The libraries you generated already have tags (the generator added them). The two apps and
   the six ready-made shared libraries have `"tags": []`. Fill them in, in each `project.json`:

   | Project                        | Folder                              | Tags                               |
   | ------------------------------ | ----------------------------------- | ---------------------------------- |
   | `ward`                         | `apps/ward`                         | `scope:ward`, `type:app`           |
   | `pharmacy`                     | `apps/pharmacy`                     | `scope:pharmacy`, `type:app`       |
   | `shared-domain`                | `libs/shared/domain`                | `scope:shared`, `type:domain`      |
   | `shared-util-dates`            | `libs/shared/util-dates`            | `scope:shared`, `type:util`        |
   | `shared-data-access-auth`      | `libs/shared/data-access-auth`      | `scope:shared`, `type:data-access` |
   | `shared-data-access-logging`   | `libs/shared/data-access-logging`   | `scope:shared`, `type:data-access` |
   | `shared-data-access-messaging` | `libs/shared/data-access-messaging` | `scope:shared`, `type:data-access` |
   | `shared-data-access-toasts`    | `libs/shared/data-access-toasts`    | `scope:shared`, `type:data-access` |

### Write the rules

2. Open `eslint.config.mjs` in the workspace root and find `depConstraints`. It holds one rule:
   `sourceTag: '*'` may import `'*'`, which allows everything. Delete it.
3. Add one rule per row of the **type matrix**. Each rule is an object like the one you
   deleted: `sourceTag` is the tag in the first column, `onlyDependOnLibsWithTags` is an array
   with the tags in the second column, written in full (`'type:ui'`, not `'ui'`).

   | A project tagged   | may import projects tagged                                                            |
   | ------------------ | ------------------------------------------------------------------------------------- |
   | `type:app`         | `type:feature`, `type:data-access`, `type:ui`, `type:domain`, `type:util`, `type:api` |
   | `type:feature`     | `type:data-access`, `type:ui`, `type:domain`, `type:util`, `type:api`                 |
   | `type:api`         | `type:data-access`, `type:ui`, `type:domain`, `type:util`                             |
   | `type:data-access` | `type:data-access`, `type:domain`, `type:util`                                        |
   | `type:ui`          | `type:ui`, `type:domain`, `type:util`                                                 |
   | `type:domain`      | `type:domain`, `type:util`                                                            |
   | `type:util`        | `type:util`                                                                           |

4. Below them, one rule per row of the **context map**: which scope may see which.

   | A project tagged   | may import projects tagged                                                            |
   | ------------------ | ------------------------------------------------------------------------------------- |
   | `scope:ward`       | `scope:ward`, `scope:monitoring`, `scope:medication`, `scope:patient`, `scope:shared` |
   | `scope:pharmacy`   | `scope:pharmacy`, `scope:shared`, `type:api`                                          |
   | `scope:monitoring` | `scope:monitoring`, `scope:shared`, `type:api`                                        |
   | `scope:medication` | `scope:medication`, `scope:shared`, `type:api`                                        |
   | `scope:patient`    | `scope:patient`, `scope:shared`                                                       |
   | `scope:shared`     | `scope:shared`                                                                        |

   `medication` and `patient` have no libraries yet: write their rules anyway. The context map
   is decided before the code. `type:api` in a scope rule means: a library another scope
   publishes on purpose (D5.9).

### See it fail

5. Run `pnpm lint`. It fails, in `monitoring-ui` only, with **5 errors** like:

   ```text
   A project tagged with "type:ui" can only depend on libs tagged with "type:ui", "type:domain", "type:util"
   ```

   Each error names a file and a line. Write down which file and which import each one points
   at. **Do not fix them yet**, and never by changing a rule: D5.6 and D5.7 do it properly.

6. Now the other direction. The pharmacy team would like the ward's `BedTile`. In
   `apps/pharmacy/src/app/app.ts`, add an import of `BedTile` from `@wm/monitoring/ui`, and run
   `pnpm nx lint pharmacy`. Read the error: which rule is it? Then delete the import again.

## Check

- `pnpm day5:check 5`
- `pnpm lint` fails with exactly the 5 errors in `monitoring-ui`, and nowhere else. (The one
  warning in `apps/ward/src/environments/environment.ts` is old: ignore it.)

## Questions

1. The 5 errors come in two kinds: two of them import the type `AlarmView`, three import
   services (`AuthStore`, `MessageBus` with `commandRetry`, `Toasts`). What is the difference
   between what the two kinds need?
2. Why did the pharmacy fail on its **scope**, when an app may import a `ui` library?
3. What would happen to these rules if somebody created a library without tags?
