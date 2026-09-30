import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { advance, setupState, text } from '../testing';
import WardOverview from './ward-overview';

// DAY 4 · S.3. Run: pnpm nx test ward --include='**/ward-overview.spec.ts' --reporters=verbose

let fixture: ComponentFixture<WardOverview>;
const el = () => fixture.nativeElement as HTMLElement;
const beds = () =>
  [...el().querySelectorAll('ul.beds li')].map((li) => text(li));
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

beforeEach(async () => {
  await setupState();
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

describe('S.3b–c: the beds of the selected ward', () => {
  it('lists ICU-1 … ICU-6, then the ER beds after a click on ER', async () => {
    expect(beds()).toEqual([
      'ICU-1',
      'ICU-2',
      'ICU-3',
      'ICU-4',
      'ICU-5',
      'ICU-6',
    ]);
    await pick('ER');
    expect(beds()).toEqual(['ER-1', 'ER-2', 'ER-3', 'ER-4', 'ER-5', 'ER-6']);
  });
});

describe('S.3d: the Store outlives the component', () => {
  it('a new component shows the ward picked before, while its own counter starts at 0', async () => {
    el().querySelector<HTMLButtonElement>('button.local')?.click();
    await pick('CARD');
    fixture.destroy();
    await render();
    expect(text(el().querySelector('.local-count'))).toBe('0');
    expect(highlighted()).toEqual(['CARD']);
    expect(beds()[0]).toBe('CARD-1');
  });
});
