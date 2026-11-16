/**
 * Performance · every topic runs in one of two modes: ❌ bad or ✅ good.
 *
 * Modes are read ONCE, at startup (localStorage, or `?perf=bad` / `?perf=good` for all topics).
 * Switching a mode in the Perf panel reloads the page, so a component can read its mode as a
 * plain constant: `if (isBad('forgotten-subscribe')) …`.
 */

export const TOPICS = {
  'change-detection': {
    title: 'Change detection: OnPush vs Eager',
    where: 'App, Nurse station, BedTile, AlarmActions',
  },
  'template-computation': {
    title: 'Computation in templates',
    where: 'Nurse station → alarm count, tiles, chips',
  },
  'for-track': {
    title: '@for and track',
    where: 'Nurse station → Active alarms',
  },
  'hot-events': { title: 'Hot events', where: 'Bed detail → chart hover' },
  'forgotten-subscribe': {
    title: 'Forgotten subscribe()',
    where: 'Bed detail → tab title',
  },
  'switch-streams': {
    title: 'mergeMap / nested subscribe vs switchMap',
    where: 'Bed detail → Next bed → tab title',
  },
  'listeners-timers': {
    title: 'Timers and window listeners',
    where: 'Bed detail → chart',
  },
  'root-service': {
    title: 'Root service keeps components',
    where: 'AlarmActions → AlarmSound',
  },
  'growing-buffer': {
    title: 'Live buffer that only grows',
    where: 'Bed detail → vitals history',
  },
  'share-replay': {
    title: 'shareReplay without refCount',
    where: 'Bed detail → live vitals, alarms',
  },
  'main-thread': {
    title: 'Heavy calculation on the main thread',
    where: 'Nurse station → HR trends',
  },
  'worker-cache': {
    title: 'Worker with a duplicated cache',
    where: 'Nurse station → HR trends (worker)',
  },
  'ws-burst': {
    title: 'Message burst after reconnect',
    where: 'Nurse station → tiles, Dev → outage / burst',
  },
} as const;

export type Topic = keyof typeof TOPICS;
export type Mode = 'bad' | 'good';
export const TOPIC_IDS = Object.keys(TOPICS) as Topic[];

const KEY = 'wm.perf';

export interface PerfSettings {
  modes: Record<Topic, Mode>;
  /** Render every ward N times on the nurse station, to make costs measurable. */
  stress: number;
  /** Show how often each instrumented component re-ran its template. */
  counters: boolean;
}

const DEFAULTS: PerfSettings = {
  modes: Object.fromEntries(TOPIC_IDS.map((t) => [t, 'good'])) as Record<
    Topic,
    Mode
  >,
  stress: 1,
  counters: false,
};

function read(): PerfSettings {
  let saved: Partial<PerfSettings> = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    /* private window: defaults */
  }
  const settings: PerfSettings = {
    ...DEFAULTS,
    ...saved,
    modes: { ...DEFAULTS.modes, ...saved.modes },
  };
  // ?perf=bad or ?perf=good switches every topic at once
  const all = new URLSearchParams(location.search).get('perf');
  if (all === 'bad' || all === 'good') {
    for (const t of TOPIC_IDS) settings.modes[t] = all;
    write(settings);
  }
  return settings;
}

function write(settings: PerfSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

/** Fixed for the lifetime of the page. */
export const PERF: Readonly<PerfSettings> = read();

export const isBad = (topic: Topic): boolean => PERF.modes[topic] === 'bad';

/** Save and reload: the new modes apply from a clean start. */
export function applyPerf(next: PerfSettings): void {
  write(next);
  location.reload();
}
