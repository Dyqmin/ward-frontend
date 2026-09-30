import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { advance, ofType, setupState, text, type StateTest } from '../testing';
import WardPicker from './ward-picker';

// DAY 4 · S.2. Run: pnpm nx test ward --include='**/ward-picker.spec.ts' --reporters=verbose

let t: StateTest;
let fixture: ComponentFixture<WardPicker>;
const selected = () => t.slice<{ selected: string }>('ward')?.selected;
const wardButton = (label: string) =>
  [
    ...(
      fixture.nativeElement as HTMLElement
    ).querySelectorAll<HTMLButtonElement>('nav.wards button'),
  ].find((b) => text(b) === label);

beforeEach(async () => {
  t = await setupState();
  fixture = TestBed.createComponent(WardPicker);
  await advance(fixture, 0);
});

afterEach(() => vi.useRealTimers());

describe('S.2a–c: the ward feature', () => {
  it('is registered under the name "ward" and starts with ICU', () => {
    expect(selected()).toBe('ICU');
  });

  it('stores the ward of "[Ward Picker] Ward Selected"', () => {
    t.store.dispatch({ type: '[Ward Picker] Ward Selected', ward: 'CARD' });
    expect(selected()).toBe('CARD');
  });
});

describe('S.2d: the buttons dispatch', () => {
  it('a click on ER dispatches "[Ward Picker] Ward Selected" with the ward ER', async () => {
    wardButton('ER')?.click();
    await advance(fixture, 0);
    expect(ofType(t.actions, '[Ward Picker] Ward Selected')).toEqual([
      { type: '[Ward Picker] Ward Selected', ward: 'ER' },
    ]);
    expect(selected()).toBe('ER');
  });
});
