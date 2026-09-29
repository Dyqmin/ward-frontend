import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { advance, text } from '../testing';
import PatientFilter from './patient-filter';

// DAY 3 · R.9. Run: pnpm nx test ward --include='**/patient-filter.spec.ts' --reporters=verbose

let fixture: ComponentFixture<PatientFilter>;
let el: HTMLElement;
const names = () =>
  [...el.querySelectorAll('ul.patients li')].map((li) => text(li));
const wardButton = (label: string) =>
  [...el.querySelectorAll<HTMLButtonElement>('nav.wards button')].find(
    (b) => text(b) === label,
  );

async function type(value: string) {
  const input = el.querySelector<HTMLInputElement>('input.search');
  if (!input) return;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await advance(fixture, 0);
}

beforeEach(async () => {
  vi.useFakeTimers();
  fixture = TestBed.createComponent(PatientFilter);
  el = fixture.nativeElement as HTMLElement;
  await advance(fixture, 400);
});

afterEach(() => vi.useRealTimers());

describe('R.9: combineLatest and debounceTime', () => {
  it('shows all 10 patients at once', () => {
    expect(names()).toHaveLength(10);
  });

  it('filters by ward', async () => {
    wardButton('ICU')?.click();
    await advance(fixture, 0);
    expect(names()).toEqual([
      'Ada Lovedrip',
      'Ben Aspirin',
      'Cleo Saline',
      'Dan Pulse',
    ]);
  });

  it('filters by name, ignoring case, only 300 ms after the last key', async () => {
    wardButton('ICU')?.click();
    await advance(fixture, 0);
    await type('D');
    await advance(fixture, 100);
    expect(names()).toHaveLength(4); // still waiting
    await advance(fixture, 300);
    expect(names()).toEqual(['Ada Lovedrip', 'Dan Pulse']);
  });

  it('combines both: a new ward keeps the search text', async () => {
    await type('e');
    await advance(fixture, 400);
    wardButton('ER')?.click();
    await advance(fixture, 0);
    expect(names()).toEqual(['Eve Bandage']);
  });
});
