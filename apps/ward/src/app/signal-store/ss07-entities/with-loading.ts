import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';

// SS.9 · your own block. The steps are in alarm-board.ts.

export function withLoading() {
  return signalStoreFeature(
    withState({ loading: false }),
    withMethods((store) => ({
      setLoading(loading: boolean): void {
        patchState(store, { loading });
      },
    })),
  );
}
