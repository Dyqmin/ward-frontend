import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';

// SS.3 · NoteStore: ready-made, you change it in SS.3b–c. The steps are in notes-page.ts.

export const NoteStore = signalStore(
  // SS.3b · no { providedIn: 'root' }: every NotePanel provides its own
  withState({ text: '' }),
  withMethods((store) => ({
    write(text: string): void {
      patchState(store, { text });
    },
  })),
  // SS.3c
  withHooks({
    onInit() {
      console.log('NoteStore created');
    },
    onDestroy() {
      console.log('NoteStore destroyed');
    },
  }),
);
