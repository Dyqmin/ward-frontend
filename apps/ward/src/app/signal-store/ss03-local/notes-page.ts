import { Component, signal } from '@angular/core';

import { NotePanel } from './note-panel';

// ============================================================================================
//  DAY 4 · SS.3 · ONE STORE FOR THE APP, OR ONE PER COMPONENT
// ============================================================================================
//  Two shift notes, A and B. Both inject NoteStore. Where does the store live?
//  [store] = note.store.ts, [panel] = note-panel.ts
//
//  SS.3a · watch (no code)
//   Type in A. B shows the same text: { providedIn: 'root' } means ONE store for the whole app.
//
//  SS.3b · one store per panel
//   [store] Remove { providedIn: 'root' }.
//   [panel] Add providers: [NoteStore] to the @Component.
//   Check: type in A. B stays empty.
//
//  SS.3c · withHooks
//   [store] Add withHooks as the LAST block: onInit logs 'NoteStore created', onDestroy logs
//          'NoteStore destroyed' (console.log).
//   Tip: withHooks takes a plain object, no ({ — withHooks({ onInit() { … }, onDestroy() { … } }).
//   Check (F12 → Console): two "created" on load. "Hide B" → "destroyed". "Show B" → "created",
//   and B is empty again: a new store.
//
//  Spec: pnpm nx test ward --include='**/notes-page.spec.ts' --reporters=verbose
// ============================================================================================

@Component({
  selector: 'app-notes-page',
  imports: [NotePanel],
  template: `
    <h2>SS.3 · One store, or one per component</h2>
    <button type="button" class="small toggle" (click)="showB.set(!showB())">
      {{ showB() ? 'Hide B' : 'Show B' }}
    </button>
    <div class="panels">
      <app-note-panel label="A" class="a" />
      @if (showB()) {
        <app-note-panel label="B" class="b" />
      }
    </div>
  `,
  styles: `
    h2 {
      margin: 0;
    }
    .toggle {
      justify-self: start;
    }
    .panels {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: 0.75rem;
    }
  `,
})
export default class NotesPage {
  protected readonly showB = signal(true);
}
