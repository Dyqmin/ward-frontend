import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { text } from '../../streams/testing';
import AlarmsPage from './alarms-page';
import * as store from './alarms.store';

// DAY 4 · SS.2. Run: pnpm nx test ward --include='**/alarms-page.spec.ts' --reporters=verbose

// Looked up by name, so this file compiles before you create the store.
const { AlarmsStore } = store as Record<string, unknown> as {
  AlarmsStore: new () => {
    alarms(): { id: string; acknowledged: boolean }[];
    openCount(): number;
    highCount(): number;
    visibleAlarms(): unknown[];
    acknowledge(id: string): void;
    toggleOnlyHigh(): void;
  };
};

let fixture: ComponentFixture<AlarmsPage>;
let el: HTMLElement;
const rows = () => [...el.querySelectorAll('ul.alarms li')];
const ackButton = (bed: string) =>
  rows()
    .find((li) => text(li.querySelector('strong')) === bed)
    ?.querySelector<HTMLButtonElement>('button');

beforeEach(async () => {
  fixture = TestBed.createComponent(AlarmsPage);
  el = fixture.nativeElement as HTMLElement;
  await fixture.whenStable();
});

describe('SS.2a–b: state and list', () => {
  it('the store starts with the 5 demo alarms', () => {
    expect(TestBed.inject(AlarmsStore).alarms()).toHaveLength(5);
  });

  it('the page lists 5 alarms', () => {
    expect(rows()).toHaveLength(5);
  });
});

describe('SS.2c: openCount', () => {
  it('is 4, and the counter shows it', () => {
    expect(TestBed.inject(AlarmsStore).openCount()).toBe(4);
    expect(text(el.querySelector('p.count strong'))).toBe('4');
  });
});

describe('SS.2d: acknowledge', () => {
  it('acknowledges one alarm, in a new list', () => {
    const s = TestBed.inject(AlarmsStore);
    const before = s.alarms();
    s.acknowledge('a1');
    expect(s.alarms()).not.toBe(before);
    expect(
      s.alarms().find((a: { id: string }) => a.id === 'a1')?.acknowledged,
    ).toBe(true);
    expect(s.openCount()).toBe(3);
  });

  it('the Acknowledge button updates the row and the counter', async () => {
    ackButton('ICU-1')?.click();
    await fixture.whenStable();
    expect(text(el.querySelector('p.count strong'))).toBe('3');
    expect(ackButton('ICU-1')).toBeFalsy();
  });
});

describe('SS.2e: extra', () => {
  it('highCount counts the open high alarms', () => {
    expect(TestBed.inject(AlarmsStore).highCount()).toBe(2);
  });

  it('the checkbox shows only high alarms', async () => {
    el.querySelector<HTMLInputElement>('.only-high input')?.click();
    await fixture.whenStable();
    expect(rows()).toHaveLength(3);
  });
});
