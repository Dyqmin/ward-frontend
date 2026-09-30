import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { advance, setupState, text, type StateTest } from '../testing';
import WardOverview from './ward-overview';

// DAY 4 · S.3. Run: pnpm nx test ward --include='**/ward-overview.spec.ts' --reporters=verbose

let t: StateTest;
let fixture: ComponentFixture<WardOverview>;
const el = () => fixture.nativeElement as HTMLElement;
const checked = () =>
  [...el().querySelectorAll('ul.checked-beds li:not(.muted)')].map((li) =>
    text(li),
  );
const wardButton = (label: string) =>
  [...el().querySelectorAll<HTMLButtonElement>('nav.wards button')].find(
    (b) => text(b) === label,
  );
const highlighted = () =>
  [...el().querySelectorAll('nav.wards button.primary')].map((b) => text(b));

async function render() {
  fixture = TestBed.createComponent(WardOverview);
  await advance(fixture, 0);
}

async function pick(label: string) {
  wardButton(label)?.click();
  await advance(fixture, 0);
}

async function checkBed(bed: string) {
  t.store.dispatch({ type: '[Night Round] Bed Checked', bed });
  await advance(fixture, 0);
}

beforeEach(async () => {
  t = await setupState();
  await render();
});

afterEach(() => vi.useRealTimers());

describe('S.3a: the picker shows the selected ward', () => {
  it('highlights ICU at start, and CARD after a click on CARD', async () => {
    expect(highlighted()).toEqual(['ICU']);
    await pick('CARD');
    expect(highlighted()).toEqual(['CARD']);
  });
});

describe('S.3b–c: the checked beds of the selected ward', () => {
  it('combines the two features: only the checked beds of the selected ward', async () => {
    await checkBed('ICU-1');
    await checkBed('ER-2');
    await checkBed('ICU-3');
    expect(checked()).toEqual(['ICU-1', 'ICU-3']);
    await pick('ER');
    expect(checked()).toEqual(['ER-2']);
    await pick('CARD');
    expect(checked()).toEqual([]);
  });

  it('follows the checklist too: a bed checked later shows up at once', async () => {
    await pick('ER');
    await checkBed('ER-5');
    expect(checked()).toEqual(['ER-5']);
  });
});

describe('S.3d: the Store outlives the component', () => {
  it('a new component shows the ward picked before, while its own counter starts at 0', async () => {
    await checkBed('CARD-1');
    el().querySelector<HTMLButtonElement>('button.local')?.click();
    await pick('CARD');
    fixture.destroy();
    await render();
    expect(text(el().querySelector('.local-count'))).toBe('0');
    expect(highlighted()).toEqual(['CARD']);
    expect(checked()).toEqual(['CARD-1']);
  });
});
