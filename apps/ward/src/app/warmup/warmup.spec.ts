import { TestBed, type ComponentFixture } from '@angular/core/testing';

import Warmup from './warmup';

// DAY 2 · EXERCISE 0 · SIGNALS WARM-UP.
// Run: pnpm nx test ward --include='**/warmup.spec.ts' --reporters=verbose

let fixture: ComponentFixture<Warmup>;
let el: HTMLElement;

const text = (e: Element | null | undefined) =>
  e?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const names = () =>
  [...el.querySelectorAll('ul.patients li button.name')].map((b) => text(b));
const count = () => text(el.querySelector('p.count'));
const wardButton = (label: string) =>
  [...el.querySelectorAll<HTMLButtonElement>('nav.wards button')].find(
    (b) => text(b) === label,
  );
const rowOf = (name: string) =>
  [...el.querySelectorAll('ul.patients li')].find(
    (li) => text(li.querySelector('button.name')) === name,
  );

async function click(button: HTMLElement | null | undefined) {
  button?.click();
  await fixture.whenStable();
}

beforeEach(async () => {
  fixture = TestBed.createComponent(Warmup);
  el = fixture.nativeElement as HTMLElement;
  await fixture.whenStable();
});

afterEach(() => vi.restoreAllMocks());

describe('Step 0.1: signal — the list', () => {
  it('lists all 10 patients, each with its bed and a Discharge button', () => {
    expect(names()).toHaveLength(10);
    expect(names()[0]).toBe('Ada Lovedrip');
    const first = el.querySelector('ul.patients li');
    expect(text(first?.querySelector('.bed'))).toBe('ICU-1');
    expect(text(first?.querySelector('button.discharge'))).toBe('Discharge');
  });
});

describe('Step 0.2: computed — one ward', () => {
  it('has one button per choice, in order', () => {
    expect(
      [...el.querySelectorAll('nav.wards button')].map((b) => text(b)),
    ).toEqual(['All', 'ICU', 'ER', 'CARD']);
  });

  it('shows only the patients of the chosen ward, and counts them', async () => {
    expect(count()).toBe('10 patients');
    await click(wardButton('ICU'));
    expect(names()).toEqual([
      'Ada Lovedrip',
      'Ben Aspirin',
      'Cleo Saline',
      'Dan Pulse',
    ]);
    expect(count()).toBe('4 patients');
    await click(wardButton('CARD'));
    expect(count()).toBe('3 patients');
    await click(wardButton('All'));
    expect(names()).toHaveLength(10);
  });

  it('marks the current ward\'s button "active"', async () => {
    expect(wardButton('All')?.classList).toContain('active');
    await click(wardButton('ER'));
    expect(wardButton('ER')?.classList).toContain('active');
    expect(wardButton('All')?.classList).not.toContain('active');
  });
});

describe('Step 0.3: update — discharge', () => {
  it('removes the patient, and the filtered list and the count follow', async () => {
    await click(wardButton('ICU'));
    await click(
      rowOf('Ben Aspirin')?.querySelector<HTMLElement>('button.discharge'),
    );
    expect(names()).toEqual(['Ada Lovedrip', 'Cleo Saline', 'Dan Pulse']);
    expect(count()).toBe('3 patients');
    await click(wardButton('All'));
    expect(count()).toBe('9 patients');
  });
});

describe('Step 0.4: effect — log what is shown', () => {
  it('logs "<ward>: <count> patients" at the start and after every change', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    fixture = TestBed.createComponent(Warmup);
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    await click(wardButton('ICU'));
    await click(
      rowOf('Dan Pulse')?.querySelector<HTMLElement>('button.discharge'),
    );
    expect(log.mock.calls.map((c) => c[0])).toEqual([
      'All: 10 patients',
      'ICU: 4 patients',
      'ICU: 3 patients',
    ]);
  });
});

describe('Step 0.5: linkedSignal — the selected patient', () => {
  const details = () => text(el.querySelector('section.details h2'));

  it('selects the first patient at the start', () => {
    expect(details()).toBe('Ada Lovedrip');
    expect(rowOf('Ada Lovedrip')?.classList).toContain('selected');
  });

  it('selects a patient on click, and keeps it while it stays in the list', async () => {
    await click(
      rowOf('Cleo Saline')?.querySelector<HTMLElement>('button.name'),
    );
    expect(details()).toBe('Cleo Saline');
    expect(rowOf('Cleo Saline')?.classList).toContain('selected');
    await click(wardButton('ICU'));
    expect(details()).toBe('Cleo Saline');
  });

  it('resets to the first patient when the selection leaves the list', async () => {
    await click(
      rowOf('Cleo Saline')?.querySelector<HTMLElement>('button.name'),
    );
    await click(wardButton('ER'));
    expect(details()).toBe('Eve Bandage');
    await click(
      rowOf('Eve Bandage')?.querySelector<HTMLElement>('button.discharge'),
    );
    expect(details()).toBe('Finn Splint');
  });

  it('says "No patient selected" when the list is empty', async () => {
    await click(wardButton('CARD'));
    for (const name of ['Hal Rhythm', 'Ivy Stent', 'Jo Valve'])
      await click(rowOf(name)?.querySelector<HTMLElement>('button.discharge'));
    expect(text(el.querySelector('section.details'))).toBe(
      'No patient selected',
    );
  });
});
