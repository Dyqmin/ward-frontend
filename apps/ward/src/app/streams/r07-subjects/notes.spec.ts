import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { text } from '../testing';
import Notes from './notes';

// DAY 3 · R.7–8. Run: pnpm nx test ward --include='**/notes.spec.ts' --reporters=verbose

let fixture: ComponentFixture<Notes>;
let el: HTMLElement;
const button = (label: string) =>
  [...el.querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => text(b) === label,
  );

async function addNote(value: string) {
  const input = el.querySelector<HTMLInputElement>('input.text');
  if (input) input.value = value;
  button('Add note')?.click();
  await fixture.whenStable();
}

beforeEach(async () => {
  fixture = TestBed.createComponent(Notes);
  el = fixture.nativeElement as HTMLElement;
  await fixture.whenStable();
});

describe('R.7: Subject', () => {
  it('Early shows the latest note pushed with "Add note"', async () => {
    await addNote('first');
    expect(text(el.querySelector('.early .note'))).toBe('first');
    await addNote('second');
    expect(text(el.querySelector('.early .note'))).toBe('second');
  });
});

describe('R.8: BehaviorSubject', () => {
  it('starts with "(no notes yet)"', () => {
    expect(text(el.querySelector('.early .note'))).toBe('(no notes yet)');
  });

  it('gives a late subscriber the latest note at once', async () => {
    await addNote('first');
    await addNote('second');
    button('Show late panel')?.click();
    await fixture.whenStable();
    expect(text(el.querySelector('.late .note'))).toBe('second');
  });

  it('shows the current value without the async pipe', async () => {
    await addNote('first');
    expect(text(el.querySelector('p.current'))).toBe('first');
  });
});
