import { TestBed } from '@angular/core/testing';

import SubscribeBasics from './subscribe-basics';

// DAY 3 · R.1. Run: pnpm nx test ward --include='**/subscribe-basics.spec.ts' --reporters=verbose

describe('R.1: subscribe and next', () => {
  let logs: unknown[];

  beforeEach(() => {
    vi.useFakeTimers();
    logs = [];
    vi.spyOn(console, 'log').mockImplementation(
      (m: unknown) => void logs.push(m),
    );
    TestBed.createComponent(SubscribeBasics);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('R.1a: logs "A: 1" … "A: 5", one per second', async () => {
    await vi.advanceTimersByTimeAsync(1000);
    expect(logs).toContain('A: 1');
    expect(logs).not.toContain('A: 2');
    await vi.advanceTimersByTimeAsync(4000);
    expect(
      logs.filter((l) => String(l).startsWith('A: ') && l !== 'A: done'),
    ).toEqual(['A: 1', 'A: 2', 'A: 3', 'A: 4', 'A: 5']);
  });

  it('R.1b: logs "A: done" after the last value', async () => {
    await vi.advanceTimersByTimeAsync(5000);
    expect(logs.indexOf('A: done')).toBeGreaterThan(logs.indexOf('A: 5'));
  });

  it('R.1c: a second subscription counts from 1 on its own, as "B"', async () => {
    await vi.advanceTimersByTimeAsync(5000);
    expect(logs.filter((l) => String(l).startsWith('B: '))).toEqual([
      'B: 1',
      'B: 2',
      'B: 3',
      'B: 4',
      'B: 5',
      'B: done',
    ]);
  });
});
