import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';

import { advance, text } from '../../streams/testing';
import AlarmBoard from './alarm-board';
import { AlarmBoardStore } from './alarm-board.store';
import * as feature from './with-loading';

// DAY 4 · SS.7–9. Run: pnpm nx test ward --include='**/alarm-board.spec.ts' --reporters=verbose

// Read by name: these members only exist after your steps.
type Board = {
  entities?(): { id: string; acknowledged: boolean }[];
  entityMap?(): Record<string, { acknowledged: boolean }>;
  alarms?(): unknown;
  openCount(): number;
  acknowledge(id: string): void;
  selectedId?(): string | null;
  select?(id: string): void;
  loading?(): boolean;
  reload(): Promise<void>;
};
const board = () => TestBed.inject(AlarmBoardStore) as unknown as Board;

let fixture: ComponentFixture<AlarmBoard>;
let el: HTMLElement;
const rows = () => [...el.querySelectorAll('ul.alarms li')];

beforeEach(async () => {
  vi.useFakeTimers();
  fixture = TestBed.createComponent(AlarmBoard);
  el = fixture.nativeElement as HTMLElement;
  await advance(fixture, 0);
});

afterEach(() => vi.useRealTimers());

describe('SS.7: entities', () => {
  it('SS.7a: the store has 5 entities and no alarms array', () => {
    expect(board().entities?.()).toHaveLength(5);
    expect(board().alarms).toBeUndefined();
  });

  it('SS.7b: acknowledge updates one entity', () => {
    board().acknowledge('a1');
    expect(board().entityMap?.()['a1']?.acknowledged).toBe(true);
    expect(board().openCount()).toBe(3);
  });

  it('SS.7c: the page lists 5 alarms, 4 open', () => {
    expect(rows()).toHaveLength(5);
    expect(text(el.querySelector('.count strong'))).toBe('4');
  });
});

describe('SS.8: withLinkedState', () => {
  it('selects the first open alarm, and again after the selected one is acknowledged', () => {
    const b = board();
    expect(b.selectedId?.()).toBe('a1');
    b.select?.('a3');
    expect(b.selectedId?.()).toBe('a3');
    b.acknowledge('a3');
    expect(b.selectedId?.()).toBe('a1');
  });

  it('Select selects the row', async () => {
    rows()[2]?.querySelector<HTMLButtonElement>('button.select')?.click();
    await advance(fixture, 0);
    expect(rows()[2]?.classList.contains('selected')).toBe(true);
  });
});

describe('SS.9: withLoading', () => {
  it('withLoading() adds loading and setLoading to any store', () => {
    const withLoading = (feature as Record<string, unknown>)['withLoading'];
    expect(withLoading).toBeTypeOf('function');
    const Store = signalStore(
      (withLoading as () => never)(),
    ) as unknown as new () => {
      loading(): boolean;
      setLoading(v: boolean): void;
    };
    const s = TestBed.runInInjectionContext(() => new Store());
    expect(s.loading()).toBe(false);
    s.setLoading(true);
    expect(s.loading()).toBe(true);
  });

  it('Reload shows "Reloading…" for half a second', async () => {
    el.querySelector<HTMLButtonElement>('button.reload')?.click();
    await advance(fixture, 100);
    expect(text(el.querySelector('.loading'))).toBe('Reloading…');
    await advance(fixture, 500);
    expect(el.querySelector('.loading')).toBeNull();
  });
});
