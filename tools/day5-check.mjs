// Day 5: compares your workspace with the solution of one step.
//
//   pnpm day5:check 3
//
// It checks the layout only: which projects exist, their tags and import paths, which source
// files live where, what each index.ts re-exports, the lint rules, and two habits (the wm-
// selector prefix in libraries, no inject() in ui libraries). It does not run lint or the
// tests: the step tells you which command to run for that.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const manifest = JSON.parse(
  readFileSync(join(root, 'tools/day5-manifest.json'), 'utf8'),
);
const step = process.argv[2];
if (!manifest.steps[step]) {
  console.log(
    `Usage: pnpm day5:check <step>, with a step from ${Object.keys(manifest.steps).join(', ')}`,
  );
  process.exit(1);
}
const want = manifest.steps[step];

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
let failed = 0;
const ok = (msg) => console.log(`${green('✓')} ${msg}`);
const bad = (msg, details = []) => {
  failed++;
  console.log(`${red('✗')} ${msg}`);
  for (const d of details.slice(0, 12)) console.log(`    ${d}`);
  if (details.length > 12)
    console.log(dim(`    … and ${details.length - 12} more`));
};

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [relative(root, path)];
  });
}
const sub = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).filter((d) => statSync(join(dir, d)).isDirectory())
    : [];

// ---------- projects, tags, import paths ----------
const have = {};
for (const app of sub('apps')) {
  const p = join('apps', app, 'project.json');
  if (existsSync(p))
    have[JSON.parse(readFileSync(p, 'utf8')).name] = {
      root: `apps/${app}`,
      file: p,
    };
}
for (const scope of sub('libs'))
  for (const lib of sub(join('libs', scope))) {
    const p = join('libs', scope, lib, 'project.json');
    if (existsSync(p))
      have[JSON.parse(readFileSync(p, 'utf8')).name] = {
        root: `libs/${scope}/${lib}`,
        file: p,
      };
  }
for (const name of Object.keys(have))
  have[name].tags =
    JSON.parse(readFileSync(have[name].file, 'utf8')).tags ?? [];

const missing = Object.keys(want.projects).filter((n) => !have[n]);
const extra = Object.keys(have).filter((n) => !want.projects[n]);
const moved = Object.keys(want.projects).filter(
  (n) => have[n] && have[n].root !== want.projects[n].root,
);
if (!missing.length && !extra.length && !moved.length)
  ok(
    `${Object.keys(want.projects).length} projects, with the right names and folders`,
  );
else
  bad('Projects', [
    ...missing.map((n) => `missing: ${n} (in ${want.projects[n].root})`),
    ...extra.map(
      (n) => `not expected after this step: ${n} (in ${have[n].root})`,
    ),
    ...moved.map(
      (n) => `${n} should be in ${want.projects[n].root}, not ${have[n].root}`,
    ),
  ]);

const tagIssues = Object.entries(want.projects)
  .filter(([n]) => have[n])
  .filter(
    ([n, p]) => [...p.tags].sort().join() !== [...have[n].tags].sort().join(),
  )
  .map(
    ([n, p]) =>
      `${n}: expected [${p.tags.join(', ')}], found [${have[n].tags.join(', ')}]`,
  );
tagIssues.length ? bad('Tags', tagIssues) : ok('Tags');

const paths =
  JSON.parse(readFileSync('tsconfig.base.json', 'utf8')).compilerOptions
    .paths ?? {};
const aliasIssues = [
  ...Object.entries(want.aliases)
    .filter(([a, t]) => paths[a]?.[0]?.replace(/^\.\//, '') !== t)
    .map(([a, t]) => `${a} should point at ${t}`),
  ...Object.keys(paths)
    .filter((a) => !want.aliases[a])
    .map((a) => `not expected: ${a}`),
];
aliasIssues.length
  ? bad('Import paths in tsconfig.base.json', aliasIssues)
  : ok('Import paths');

// ---------- source files ----------
const files = [
  ...sub('apps').flatMap((a) => walk(join('apps', a, 'src'))),
  ...sub('libs').flatMap((s) =>
    sub(join('libs', s)).flatMap((l) => walk(join('libs', s, l, 'src'))),
  ),
].filter((f) => !f.endsWith('.DS_Store'));
const wanted = new Set(want.files);
const got = new Set(files);
const absent = want.files.filter((f) => !got.has(f));
const surplus = files.filter((f) => !wanted.has(f));
if (!absent.length && !surplus.length)
  ok(`${want.files.length} source files, each in its place`);
else
  bad('Source files', [
    ...absent.map((f) => `missing: ${f}`),
    ...surplus.map((f) => `not in the solution: ${f}`),
  ]);

// ---------- public APIs ----------
const fromRe = /export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from\s+'([^']+)'/g;
const apiIssues = [];
for (const [name, specs] of Object.entries(want.exports)) {
  const index = have[name] && join(have[name].root, 'src/index.ts');
  if (!index || !existsSync(index)) continue;
  const found = [...readFileSync(index, 'utf8').matchAll(fromRe)]
    .map((m) => m[1])
    .sort();
  const exp = [...specs].sort();
  if (found.join() !== exp.join())
    apiIssues.push(
      `${index}: re-exports [${found.join(', ')}], expected [${exp.join(', ')}]`,
    );
}
apiIssues.length ? bad('index.ts files', apiIssues) : ok('index.ts files');

// ---------- lint rules ----------
const config = (
  await import(pathToFileURL(join(root, 'eslint.config.mjs')).href)
).default;
const rule = config
  .map((c) => c.rules?.['@nx/enforce-module-boundaries'])
  .find(Boolean);
const norm = (cs) =>
  JSON.stringify(
    (cs ?? [])
      .map((c) => ({
        sourceTag: c.sourceTag,
        only: [...(c.onlyDependOnLibsWithTags ?? [])].sort(),
      }))
      .sort((a, b) => a.sourceTag.localeCompare(b.sourceTag)),
  );
const options = rule?.[1] ?? {};
if (norm(options.depConstraints) === norm(want.constraints))
  ok('depConstraints in eslint.config.mjs');
else {
  const mine = new Map(
    (options.depConstraints ?? []).map((c) => [
      c.sourceTag,
      [...c.onlyDependOnLibsWithTags].sort().join(', '),
    ]),
  );
  bad(
    'depConstraints in eslint.config.mjs',
    want.constraints
      .map((c) => {
        const exp = [...c.onlyDependOnLibsWithTags].sort().join(', ');
        return mine.get(c.sourceTag) === exp
          ? null
          : `${c.sourceTag}: expected [${exp}], found [${mine.get(c.sourceTag) ?? 'no rule'}]`;
      })
      .filter(Boolean)
      .concat(
        [...mine.keys()]
          .filter((t) => !want.constraints.some((c) => c.sourceTag === t))
          .map((t) => `${t}: a rule the solution does not have`),
      ),
  );
}
const allow = JSON.stringify(options.allow ?? []);
allow === JSON.stringify(want.allow)
  ? ok('No exceptions added to the allow list')
  : bad('The allow list changed: fix the import, not the rule', [
      `allow: ${allow}`,
    ]);

// ---------- habits ----------
const libFiles = files.filter((f) => f.startsWith('libs/'));
const prefix = libFiles
  .filter((f) => /\.(ts|html)$/.test(f))
  .flatMap((f) => {
    const text = readFileSync(f, 'utf8');
    return /selector: 'app-|<app-/.test(text) ? [f] : [];
  });
prefix.length
  ? bad('Libraries use the wm- prefix (app- belongs to the ward app)', prefix)
  : ok('Selectors in libraries start with wm-');

const uiRoots = Object.entries(have)
  .filter(([, p]) => p.tags.includes('type:ui'))
  .map(([, p]) => p.root + '/');
const injecting = libFiles
  .filter(
    (f) =>
      uiRoots.some((r) => f.startsWith(r)) &&
      f.endsWith('.ts') &&
      !f.endsWith('.spec.ts'),
  )
  .filter((f) => /\binject\(/.test(readFileSync(f, 'utf8')));
if (!want.injectFreeUi) {
  if (injecting.length)
    console.log(
      dim(
        `· inject() in a ui library (fixed in a later step): ${injecting.join(', ')}`,
      ),
    );
} else
  injecting.length
    ? bad('ui libraries inject nothing', injecting)
    : ok('No inject() in the ui libraries');

console.log();
if (failed) {
  console.log(
    red(`${failed} check(s) differ from the solution of D5.${step}.`),
  );
  console.log(
    dim(
      `Compare in detail: git diff --stat origin/day-5-solution-${step} -- apps libs`,
    ),
  );
} else console.log(green(`Your workspace matches the solution of D5.${step}.`));
console.log(`Lint after this step: ${want.lint}`);
process.exit(failed ? 1 : 0);
