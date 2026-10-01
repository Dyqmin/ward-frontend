import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { text } from '../../streams/testing';
import MyBeds from './my-beds';
import * as store from './my-beds.store';

// DAY 4 · SS.1. Run: pnpm nx test ward --include='**/my-beds.spec.ts' --reporters=verbose

// Looked up by name, so this file compiles before you create the store.
const { MyBedsStore } = store as Record<string, unknown> as {
  MyBedsStore: new () => {
    beds(): string[];
    count(): number;
    toggle(bed: string): void;
  };
};

let fixture: ComponentFixture<MyBeds>;
let el: HTMLElement;
const bedButton = (bed: string) =>
  [...el.querySelectorAll<HTMLButtonElement>('.beds button')].find(
    (b) => text(b) === bed,
  );
async function click(bed: string) {
  bedButton(bed)?.click();
  await fixture.whenStable();
}

beforeEach(async () => {
  fixture = TestBed.createComponent(MyBeds);
  el = fixture.nativeElement as HTMLElement;
  await fixture.whenStable();
});

describe('SS.1a: the state', () => {
  it('MyBedsStore starts with no beds', () => {
    expect(TestBed.inject(MyBedsStore).beds()).toEqual([]);
  });
});

describe('SS.1c: toggle', () => {
  it('adds a bed, and removes it on the second call', () => {
    const s = TestBed.inject(MyBedsStore);
    s.toggle('ICU-1');
    s.toggle('ER-2');
    expect(s.beds()).toEqual(['ICU-1', 'ER-2']);
    s.toggle('ICU-1');
    expect(s.beds()).toEqual(['ER-2']);
  });

  it('clicking ICU-1 and ER-2 shows "Mine: ICU-1, ER-2"', async () => {
    await click('ICU-1');
    await click('ER-2');
    expect(text(el.querySelector('p.mine'))).toBe('Mine: ICU-1, ER-2');
  });
});

describe('SS.1d: count', () => {
  it('counts the beds, and the counter shows it', async () => {
    await click('ICU-1');
    await click('ICU-2');
    expect(TestBed.inject(MyBedsStore).count()).toBe(2);
    expect(text(el.querySelector('p.count'))).toBe('My beds: 2');
  });
});
