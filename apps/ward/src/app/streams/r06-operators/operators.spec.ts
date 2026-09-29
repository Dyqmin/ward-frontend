import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { advance, text } from '../testing';
import Operators from './operators';

// DAY 3 · R.6. Run: pnpm nx test ward --include='**/operators.spec.ts' --reporters=verbose
// Samples: 72, 118, 75, 75, 131, 64, 64, 99 — one per second.

let fixture: ComponentFixture<Operators>;
let logs: unknown[];
const shown = (cls: string) =>
  text((fixture.nativeElement as HTMLElement).querySelector(`p.${cls}`));

beforeEach(async () => {
  vi.useFakeTimers();
  logs = [];
  vi.spyOn(console, 'log').mockImplementation(
    (m: unknown) => void logs.push(m),
  );
  fixture = TestBed.createComponent(Operators);
  await advance(fixture, 0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('R.6a: map', () => {
  it('shows "HR <value> bpm" for the latest sample', async () => {
    await advance(fixture, 1000);
    expect(shown('r6a')).toBe('HR 72 bpm');
    await advance(fixture, 1000);
    expect(shown('r6a')).toBe('HR 118 bpm');
    await advance(fixture, 6000);
    expect(shown('r6a')).toBe('HR 99 bpm');
  });
});

describe('R.6b: filter', () => {
  it('only lets values above 100 through', async () => {
    await advance(fixture, 1000);
    expect(shown('r6b')).toBe('');
    await advance(fixture, 1000);
    expect(shown('r6b')).toBe('118');
    await advance(fixture, 2000);
    expect(shown('r6b')).toBe('118');
    await advance(fixture, 1000);
    expect(shown('r6b')).toBe('131');
    await advance(fixture, 3000);
    expect(shown('r6b')).toBe('131');
  });
});

describe('R.6c: take', () => {
  it('keeps the first three values, then stops at 75', async () => {
    await advance(fixture, 2000);
    expect(shown('r6c')).toBe('118');
    await advance(fixture, 6000);
    expect(shown('r6c')).toBe('75');
  });
});

describe('R.6d: distinctUntilChanged + tap', () => {
  it('skips a value equal to the one before, and logs "R.6d <value>" for the rest', async () => {
    await advance(fixture, 8000);
    expect(logs.filter((l) => String(l).startsWith('R.6d '))).toEqual([
      'R.6d 72',
      'R.6d 118',
      'R.6d 75',
      'R.6d 131',
      'R.6d 64',
      'R.6d 99',
    ]);
    expect(shown('r6d')).toBe('99');
  });
});
