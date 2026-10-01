# shared-domain

The shared kernel of Ward Monitor: the backend contract (`contract.ts` and `game-contract.ts`, copied unchanged from ward-worker) and the pure helpers every part of the app builds on (`ALL_BEDS`, `wardOf`, `bedsOf`, `toSlug`, `THRESHOLDS`, `link()`, `who()`).

Plain TypeScript, no Angular. Every scope may import it, so keep it small: a change here affects almost every project.

- Import path: `@wm/shared/domain`
- Tags: `scope:shared, type:domain` (added in D5.5)
- Tests: `pnpm nx test shared-domain`
