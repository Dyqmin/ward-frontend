import { Component, inject, input } from '@angular/core';

import { NoteStore } from './note.store';

/** SS.3 · A shift note. SS.3b: give every panel its own NoteStore. */
@Component({
  selector: 'app-note-panel',
  providers: [NoteStore], // SS.3b
  template: `
    <section class="card panel">
      <h3>{{ label() }}</h3>
      <textarea
        #box
        rows="3"
        [value]="store.text()"
        (input)="store.write(box.value)"
      ></textarea>
      <p class="muted">{{ store.text().length }} characters</p>
    </section>
  `,
  styles: `
    h3,
    p {
      margin: 0;
    }
    .panel {
      display: grid;
      gap: 0.4rem;
    }
  `,
})
export class NotePanel {
  readonly label = input.required<string>();
  protected readonly store = inject(NoteStore);
}
