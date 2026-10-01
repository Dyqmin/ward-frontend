import { TestBed, type ComponentFixture } from '@angular/core/testing';

import NotesPage from './notes-page';

// DAY 4 · SS.3. Run: pnpm nx test ward --include='**/notes-page.spec.ts' --reporters=verbose

let fixture: ComponentFixture<NotesPage>;
let el: HTMLElement;
let log: ReturnType<typeof vi.spyOn>;
const box = (panel: 'a' | 'b') =>
  el.querySelector<HTMLTextAreaElement>(`app-note-panel.${panel} textarea`);

async function type(panel: 'a' | 'b', value: string) {
  const b = box(panel);
  if (!b) return;
  b.value = value;
  b.dispatchEvent(new Event('input'));
  await fixture.whenStable();
}

beforeEach(async () => {
  log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  fixture = TestBed.createComponent(NotesPage);
  el = fixture.nativeElement as HTMLElement;
  await fixture.whenStable();
});

afterEach(() => log.mockRestore());

const logged = (text: string) =>
  log.mock.calls.filter((c: unknown[]) => c[0] === text).length;

describe('SS.3b: one store per panel', () => {
  it('typing in A leaves B empty', async () => {
    await type('a', 'Bed ICU-3: call family');
    expect(box('b')?.value).toBe('');
  });
});

describe('SS.3c: withHooks', () => {
  it('logs "NoteStore created" once per panel', () => {
    expect(logged('NoteStore created')).toBe(2);
  });

  it('logs "NoteStore destroyed" when B is hidden', async () => {
    el.querySelector<HTMLButtonElement>('button.toggle')?.click();
    await fixture.whenStable();
    expect(logged('NoteStore destroyed')).toBe(1);
  });
});
