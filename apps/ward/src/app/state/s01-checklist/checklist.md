# S.1 · Look inside a Store

**Tab:** S.1 look · **Spec:** `pnpm nx test ward --include='**/checklist.spec.ts' --reporters=verbose`

This tab is ready-made, except one rule you change in S.1c: a checklist for the night round,
over every bed of the three wards. You click and you read.

The Store holds the state of the whole app in **one** object. Nobody changes that object
directly:

- a component **dispatches** an action: a plain object that says what happened;
- a **reducer**, a pure function, takes the current state and the action and returns the **next**
  state.

The Store inspector on the right of the page shows both: the last actions, and the state after
them.

| Short name | File                                         |
| ---------- | -------------------------------------------- |
| [actions]  | [checklist.actions.ts](checklist.actions.ts) |
| [feature]  | [checklist.feature.ts](checklist.feature.ts) |
| [ts]       | [checklist.ts](checklist.ts)                 |
| [html]     | [checklist.html](checklist.html)             |

## S.1a · Watch (no code)

Click **ICU-1**, then **ER-2**, then **Reset round**. After every click, read the inspector:

- which action arrived: its type, and the data it carries;
- what `checklist` in the state looks like now.

## S.1b · Follow one click through the code (no code)

Answer in a comment under the instruction block in [checklist.ts](checklist.ts):

1. [html] and [ts]: which method runs when you click ICU-1, and what does it hand to the Store?
2. [actions]: where does the type "[Night Round] Bed Checked" come from?
3. [feature]: which function turned that action into the new state?
4. Click ICU-1 twice. What does the state show after the second click, and which line in
   [feature] decides that?

## S.1c · Change a rule: your first Store code

**[feature]** A second click on a checked bed should **uncheck** it. In the handler for
Bed Checked, when the bed is already in `checked`, return a new state whose `checked` is the old
list without that bed (filter). Keep the other case as it is.

**Check:** click ICU-1 twice. The inspector shows two "Bed Checked" actions, and ICU-1 is no
longer in `checked`. You changed only the rule: not the component, not the action.
