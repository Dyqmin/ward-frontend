// Compare two (or more) variants of the app, the way benchmarks do it: many runs, CPU throttled,
// a metric read from the browser, and the median instead of one lucky number.
//
//   pnpm serve:prod                      (another terminal; production build!)
//   pnpm bench main-thread               bad vs good of one topic
//   pnpm bench ws-burst --runs 15 --cpu 4 --seconds 10
//
// Metric per run: long tasks during the window (PerformanceObserver 'longtask'):
//   TBT = Σ (duration − 50 ms), the "blocking" part of every long task. Lower is better.
// Uses YOUR installed Chrome (channel 'chrome'): no browser download.
// Not a project dependency, so the lockfile stays as it is. Once: pnpm add -D playwright-core
const { chromium } = await import('playwright-core').catch(() => {
  console.error('Missing playwright-core. Run once: pnpm add -D playwright-core');
  process.exit(1);
});

const args = process.argv.slice(2);
const topic = args.find((a) => !a.startsWith('--'));
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : dflt;
};
const RUNS = opt('runs', 10);
const CPU = opt('cpu', 4);
const SECONDS = opt('seconds', 10);
const BASE = process.env.BASE_URL ?? 'http://localhost:4200';

if (!topic) {
  console.error(
    'usage: pnpm bench <topic> [--runs 10] [--cpu 4] [--seconds 10]',
  );
  process.exit(1);
}

const session = {
  token: 'mock-token',
  participantId: 'nurse_bench_mock',
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  sharedRoom: 'ward',
  sandboxRoom: 'sandbox-nurse_bench_mock',
  name: 'bench',
  useSandbox: false,
};

async function run(browser, mode) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(
    ([topic, mode, session]) => {
      // signed in, mock broker, every topic ✅ except the one we compare
      sessionStorage.setItem('ward.session', JSON.stringify(session));
      sessionStorage.setItem('ward.mock', '1');
      const modes =
        JSON.parse(localStorage.getItem('wm.perf') ?? '{}').modes ?? {};
      for (const k of Object.keys(modes)) modes[k] = 'good';
      modes[topic] = mode;
      localStorage.setItem(
        'wm.perf',
        JSON.stringify({ modes, stress: 1, counters: false }),
      );
      // collect long tasks from the very start
      window.__long = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          window.__long.push({ start: e.startTime, dur: e.duration });
      }).observe({ type: 'longtask', buffered: true });
    },
    [topic, mode, session],
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });

  await page.goto(`${BASE}/ward`);
  await page.waitForSelector('app-bed-tile');
  await page.waitForTimeout(3000); // warm-up: snapshots, first renders
  const from = await page.evaluate(() => performance.now());
  if (topic === 'ws-burst') {
    await page.evaluate(() =>
      document.querySelector('.toolbar .toggle')?.click(),
    );
    await page.getByRole('button', { name: /Burst/ }).click();
  }
  await page.waitForTimeout(SECONDS * 1000);
  const long = await page.evaluate(
    (from) => window.__long.filter((t) => t.start >= from),
    from,
  );
  await context.close();
  return {
    tbt: long.reduce((s, t) => s + Math.max(0, t.dur - 50), 0),
    count: long.length,
    max: Math.max(0, ...long.map((t) => t.dur)),
  };
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2
    ? s[s.length >> 1]
    : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const p = (xs, q) =>
  [...xs].sort((a, b) => a - b)[
    Math.min(xs.length - 1, Math.floor(q * xs.length))
  ];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = {};
// interleave bad/good, so a slow minute on your laptop hurts both variants equally
for (let i = 0; i < RUNS; i++) {
  for (const mode of ['bad', 'good']) {
    (results[mode] ??= []).push(await run(browser, mode));
    process.stdout.write('.');
  }
}
await browser.close();

console.log(
  `\n\n${topic} · ${RUNS} runs each · CPU ×${CPU} · ${SECONDS} s window\n`,
);
console.table(
  Object.fromEntries(
    Object.entries(results).map(([mode, rs]) => [
      mode,
      {
        'TBT median (ms)': Math.round(median(rs.map((r) => r.tbt))),
        'TBT p90 (ms)': Math.round(
          p(
            rs.map((r) => r.tbt),
            0.9,
          ),
        ),
        'long tasks (median)': median(rs.map((r) => r.count)),
        'longest (median ms)': Math.round(median(rs.map((r) => r.max))),
      },
    ]),
  ),
);
