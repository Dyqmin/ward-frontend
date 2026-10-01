import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { advance, text } from '../../streams/testing';
import { DIRECTORY_DELAY_MS, PatientDirectory } from '../signal-store-data';
import PatientSearch from './patient-search';
import * as store from './patient-search.store';

// DAY 4 · SS.4–6. Run: pnpm nx test ward --include='**/patient-search.spec.ts' --reporters=verbose

// Looked up by name, so this file compiles before you create the store.
const { PatientSearchStore } = store as Record<string, unknown> as {
  PatientSearchStore: new () => {
    term(): string;
    patients(): unknown[];
    loading(): boolean;
    setTerm?(term: string): void;
  };
};

let fixture: ComponentFixture<PatientSearch>;
let el: HTMLElement;
const names = () =>
  [...el.querySelectorAll('ul.patients li')].map((li) => text(li));
const requests = () => TestBed.inject(PatientDirectory).requests();
/** Long enough for SS.6's debounce plus the directory's answer. */
const settle = () => advance(fixture, 300 + DIRECTORY_DELAY_MS + 50);

async function type(value: string) {
  const input = el.querySelector<HTMLInputElement>('input.search');
  if (!input) return;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await advance(fixture, 0);
}

beforeEach(async () => {
  vi.useFakeTimers();
  fixture = TestBed.createComponent(PatientSearch);
  el = fixture.nativeElement as HTMLElement;
  await advance(fixture, 0);
});

afterEach(() => vi.useRealTimers());

describe('SS.4: load', () => {
  it('starts with an empty term', () => {
    expect(TestBed.inject(PatientSearchStore).term()).toBe('');
  });

  it('loads all 10 patients on start, with Loading… meanwhile', async () => {
    await advance(fixture, 350);
    expect(text(el.querySelector('.loading'))).toBe('Loading…');
    await settle();
    expect(names()).toHaveLength(10);
    expect(el.querySelector('.loading')).toBeNull();
  });

  it('typing "ada" shows only Ada Lovedrip', async () => {
    await settle();
    await type('ada');
    await settle();
    expect(names()).toEqual(['Ada Lovedrip ICU-1']);
  });
});

describe('SS.5: signalMethod', () => {
  it('setTerm alone reloads the list', async () => {
    await settle();
    const s = TestBed.inject(PatientSearchStore);
    s.setTerm?.('ben');
    await settle();
    expect(s.term()).toBe('ben');
    expect(s.patients()).toHaveLength(1);
  });
});

describe('SS.6: rxMethod', () => {
  it('fast typing sends one request, not three', async () => {
    await settle();
    const before = requests();
    await type('a');
    await type('an');
    await type('ann');
    await settle();
    expect(requests() - before).toBe(1);
  });
});
