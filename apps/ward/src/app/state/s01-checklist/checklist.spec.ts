import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { advance, ofType, setupState, text, type StateTest } from '../testing';
import Checklist from './checklist';

// DAY 4 · S.1. Run: pnpm nx test ward --include='**/checklist.spec.ts' --reporters=verbose

let t: StateTest;
let fixture: ComponentFixture<Checklist>;
const checked = () => t.slice<{ checked: string[] }>('checklist')?.checked;
const bedButton = (label: string) =>
  [
    ...(
      fixture.nativeElement as HTMLElement
    ).querySelectorAll<HTMLButtonElement>('nav.beds button'),
  ].find((b) => text(b) === label);

async function click(label: string) {
  bedButton(label)?.click();
  await advance(fixture, 0);
}

beforeEach(async () => {
  t = await setupState();
  fixture = TestBed.createComponent(Checklist);
  await advance(fixture, 0);
});

afterEach(() => vi.useRealTimers());

describe('S.1: the ready-made checklist', () => {
  it('dispatches "[Night Round] Bed Checked" and stores the bed', async () => {
    await click('ICU-1');
    await click('ICU-3');
    expect(ofType(t.actions, '[Night Round] Bed Checked')).toEqual([
      { type: '[Night Round] Bed Checked', bed: 'ICU-1' },
      { type: '[Night Round] Bed Checked', bed: 'ICU-3' },
    ]);
    expect(checked()).toEqual(['ICU-1', 'ICU-3']);
  });
});

describe('S.1c: a second click unchecks', () => {
  it('removes a bed that is already checked, and keeps the others', async () => {
    await click('ICU-1');
    await click('ICU-3');
    await click('ICU-1');
    expect(checked()).toEqual(['ICU-3']);
    expect(bedButton('ICU-1')?.classList.contains('primary')).toBe(false);
  });
});
