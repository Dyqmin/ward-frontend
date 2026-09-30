# S.3 · Selectors

**Tab:** S.3 selectors · **Spec:** `pnpm nx test ward --include='**/ward-overview.spec.ts' --reporters=verbose`

A **selector** reads one piece of the state. `createFeature` already made one for every field of
your feature: `wardFeature.selectSelected`.

- The store's `selectSignal` turns a selector into a signal, so a template updates by itself.
- `createSelector` builds a **new** selector from others, and runs its last function (the
  projector) again only when their results change.

| Short name    | File                                                         |
| ------------- | ------------------------------------------------------------ |
| [picker]      | [../s02-ward/ward-picker.ts](../s02-ward/ward-picker.ts)     |
| [picker html] | [../s02-ward/ward-picker.html](../s02-ward/ward-picker.html) |
| [feature]     | [../s02-ward/ward.feature.ts](../s02-ward/ward.feature.ts)   |
| [ts]          | [ward-overview.ts](ward-overview.ts)                         |
| [html]        | [ward-overview.html](ward-overview.html)                     |

## S.3a · The picker shows the selected ward

- **[picker]** Create a protected field `selected`: the store's `selectSignal` of
  `wardFeature.selectSelected`.
- **[picker html]** Give each ward button the class `primary` when its ward is the `selected()` one
  (a `[class.primary]` binding).

**Check:** the button of the selected ward is highlighted, here and on tab S.2.

## S.3b · A derived selector

**[feature]** Under `wardFeature`, create and export a const `selectSelectedBeds`:
`createSelector` with one input selector, `wardFeature.selectSelected`, and a projector that turns
the ward into its beds with `bedsOf` (from `@core/messaging/contract`).

## S.3c · Read it here

- **[ts]** Inject the Store into a private readonly field `store`.
- **[ts]** Create a protected field `beds`: the store's `selectSignal` of `selectSelectedBeds`.
- **[html]** In the `<ul class="beds">`: an `@for` over `beds()` (track the bed itself), one `<li>`
  per bed with its name.

**Check:** ICU-1 … ICU-6. Click ER: ER-1 … ER-6.

## S.3d · State that outlives the component (no code)

The button **Clicks on this tab** is ready: it counts in a plain signal of **this** component.

1. Click it a few times and pick CARD.
2. Go to tab S.2 and come back: the counter is 0 again (a new component, a new signal), but CARD is
   still selected. The Store lives outside the components, as long as the app runs.
3. Reload the page (F5): the Store starts again from its initial state, ICU.

Answer in a comment under the instruction block in [ward-overview.ts](ward-overview.ts): where
would you keep "which ward the nurse is looking at", and where "is this dropdown open"? Why?
