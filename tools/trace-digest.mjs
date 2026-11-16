// A Performance-panel trace is tens of MB: too big for a chat, and it may hold patient data in
// strings. This turns it into a ~2 KB markdown digest you can read yourself or hand to an AI.
//
//   DevTools → Performance → record → ⬇ "Save trace" (Trace-*.json or .json.gz)
//   pnpm trace:digest Trace-20261117T101500.json > digest.md
//
// Numbers only: no URLs' query strings, no argument values, no DOM text.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const file = process.argv[2];
if (!file) {
  console.error('usage: pnpm trace:digest <trace.json[.gz]>');
  process.exit(1);
}
let raw = readFileSync(file);
if (file.endsWith('.gz')) raw = gunzipSync(raw);
const json = JSON.parse(raw.toString('utf8'));
const events = Array.isArray(json) ? json : json.traceEvents;

// ── the page's main thread ───────────────────────────────────────────────────
const mains = events.filter(
  (e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain',
);
// A trace recorded with a reload also holds the renderer of the page that was there before, and
// that one can have MORE events while doing almost no work. The page is where the task time is.
const busiest = mains
  .map((m) => ({
    pid: m.pid,
    tid: m.tid,
    busy: events
      .filter(
        (e) =>
          e.pid === m.pid &&
          e.tid === m.tid &&
          e.name === 'RunTask' &&
          e.ph === 'X',
      )
      .reduce((s, e) => s + (e.dur ?? 0), 0),
  }))
  .sort((a, b) => b.busy - a.busy)[0];
if (!busiest) throw new Error('No CrRendererMain thread in this trace');
const onMain = (e) => e.pid === busiest.pid && e.tid === busiest.tid;
const main = events.filter(onMain);

const ms = (us) => Math.round(us / 100) / 10;
const span = (() => {
  const ts = main.filter((e) => e.ts).map((e) => e.ts);
  return { from: Math.min(...ts), to: Math.max(...ts) };
})();
const seconds = (span.to - span.from) / 1e6;

// ── long tasks ───────────────────────────────────────────────────────────────
const tasks = main.filter((e) => e.name === 'RunTask' && e.ph === 'X' && e.dur);
const long = tasks.filter((t) => t.dur > 50_000).sort((a, b) => b.dur - a.dur);
const tbt = long.reduce((s, t) => s + (t.dur - 50_000), 0);
const inside = (t) => (e) => e.ts >= t.ts && e.ts < t.ts + t.dur;

// what kind of work fills a task
const KINDS = {
  script: [
    'FunctionCall',
    'EvaluateScript',
    'v8.compile',
    'TimerFire',
    'EventDispatch',
    'RunMicrotasks',
    'FireAnimationFrame',
  ],
  layout: ['Layout', 'UpdateLayoutTree', 'RecalculateStyles'],
  paint: ['Paint', 'PrePaint', 'Layerize', 'Commit'],
  gc: ['MinorGC', 'MajorGC', 'V8.GC_SCAVENGER', 'V8.GC_MARK_COMPACTOR'],
};
const kindOf = (name) =>
  Object.keys(KINDS).find((k) => KINDS[k].includes(name));

// ── self time per function, from the CPU profile samples ─────────────────────
// one profile per thread (a worker has its own, in the same process): keep the main thread's
const mainProfiles = new Set(
  events.filter((e) => e.name === 'Profile' && onMain(e)).map((e) => e.id),
);
const nodes = new Map();
const self = new Map();
for (const e of events.filter(
  (e) =>
    e.name === 'ProfileChunk' &&
    e.pid === busiest.pid &&
    mainProfiles.has(e.id),
)) {
  const p = e.args?.data?.cpuProfile;
  for (const n of p?.nodes ?? []) nodes.set(n.id, n);
  const samples = p?.samples ?? [];
  const deltas = e.args?.data?.timeDeltas ?? [];
  samples.forEach((id, i) =>
    self.set(id, (self.get(id) ?? 0) + (deltas[i] ?? 0)),
  );
}
const byFunction = new Map();
for (const [id, us] of self) {
  const cf = nodes.get(id)?.callFrame;
  if (!cf) continue;
  const fn = cf.functionName || '(anonymous)';
  if (['(idle)', '(program)', '(root)'].includes(fn)) continue;
  const where = cf.url
    ? `${cf.url.split('?')[0].split('/').pop()}:${(cf.lineNumber ?? 0) + 1}`
    : '';
  const key = `${fn} ${where}`.trim();
  byFunction.set(key, (byFunction.get(key) ?? 0) + us);
}
const topSelf = [...byFunction].sort((a, b) => b[1] - a[1]).slice(0, 12);

// ── layout thrashing, GC, Angular track ──────────────────────────────────────
// a Layout that starts while a FunctionCall is still running was forced by that script
const calls = main
  .filter((e) => e.name === 'FunctionCall' && e.dur)
  .sort((a, b) => a.ts - b.ts);
const maxEnd = [];
calls.forEach(
  (c, i) => (maxEnd[i] = Math.max(maxEnd[i - 1] ?? 0, c.ts + c.dur)),
);
const lastCallBefore = (ts) => {
  let lo = 0,
    hi = calls.length - 1,
    r = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (calls[mid].ts <= ts) ((r = mid), (lo = mid + 1));
    else hi = mid - 1;
  }
  return r;
};
const forced = main.filter((e) => {
  if (e.name !== 'Layout' && e.name !== 'UpdateLayoutTree') return false;
  const i = lastCallBefore(e.ts);
  return i >= 0 && maxEnd[i] > e.ts;
});
const gcs = main.filter((e) => KINDS.gc.includes(e.name) && e.dur);
const angular = new Map();
for (const e of events) {
  const d = e.args?.data ?? e.args ?? {};
  const track = `${d.track ?? ''} ${d.trackGroup ?? ''} ${e.cat ?? ''}`;
  if (!/angular/i.test(track) || (!e.dur && !d.end)) continue;
  const name = (d.name ?? d.message ?? e.name ?? '').toString().slice(0, 60);
  const dur = e.dur ?? 0;
  const a = angular.get(name) ?? { n: 0, us: 0 };
  angular.set(name, { n: a.n + 1, us: a.us + dur });
}

// ── tasks per second: the "picket fence" ─────────────────────────────────────
const shortTasks = tasks.filter((t) => t.dur > 1_000 && t.dur <= 50_000);

// ── output ───────────────────────────────────────────────────────────────────
const out = [];
out.push(`# Trace digest · ${file.split('/').pop()}`, '');
out.push(`Recorded ${seconds.toFixed(1)} s of the main thread.`, '');
out.push('## Overview', '');
out.push('| metric | value |', '|---|---|');
out.push(
  `| long tasks (> 50 ms) | ${long.length} (${(long.length / seconds).toFixed(2)}/s) |`,
);
out.push(`| total blocking time | ${ms(tbt)} ms |`);
out.push(
  `| tasks 1–50 ms | ${shortTasks.length} (${(shortTasks.length / seconds).toFixed(1)}/s) |`,
);
out.push(`| layout inside JS (forced reflow candidates) | ${forced.length} |`);
out.push(
  `| GC events / total | ${gcs.length} / ${ms(gcs.reduce((s, g) => s + g.dur, 0))} ms |`,
  '',
);

out.push(
  '## Longest tasks',
  '',
  '| ms | script | layout | paint | gc |',
  '|---|---|---|---|---|',
);
for (const t of long.slice(0, 8)) {
  const split = { script: 0, layout: 0, paint: 0, gc: 0 };
  for (const e of main.filter(inside(t))) {
    const k = kindOf(e.name);
    if (k && e.dur) split[k] += e.dur;
  }
  out.push(
    `| ${ms(t.dur)} | ${ms(split.script)} | ${ms(split.layout)} | ${ms(split.paint)} | ${ms(split.gc)} |`,
  );
}
out.push(
  '',
  '## Top self time (CPU samples)',
  '',
  '| ms | function · file:line |',
  '|---|---|',
);
for (const [k, us] of topSelf) out.push(`| ${ms(us)} | \`${k}\` |`);
if (angular.size) {
  out.push(
    '',
    '## Angular track (ng.enableProfiling)',
    '',
    '| entries | ms | name |',
    '|---|---|---|',
  );
  for (const [name, a] of [...angular]
    .sort((x, y) => y[1].us - x[1].us)
    .slice(0, 10))
    out.push(`| ${a.n} | ${ms(a.us)} | ${name} |`);
}
out.push(
  '',
  '## Shapes to check',
  '',
  '- wall: long tasks with mostly script → heavy calculation (worker, cheaper algorithm, compute less often)',
  '- picket fence: many short tasks per second → change detection per message/tick',
  '- layout inside JS → forced reflow (read layout before writing, or afterNextRender)',
  '- many GCs → allocation churn (copying arrays per message, growing buffers)',
);
console.log(out.join('\n'));
