# Exercises: measure, find, fix, measure again

Four exercises, the same five steps every time:

1. **Measure** with the topic on ❌ and write the number down.
2. **Find** the line of code the tool points at.
3. **Fix** the ❌ branch in that file. Leave the topic on ❌. The ✅ branch is right next to it and
   it is the answer: before you read it, write down in your own words what you will change.
4. **Measure again**, the same way. The number must move.
5. **Compare** your fix with the ✅ branch.

## Setup

- Run `pnpm start` (development build: class names stay readable).
- Open `http://localhost:4200/ward?mock=0`. Type any name, leave the room code as it is, choose
  role **Nurse**, tick **Use my private sandbox room (for the lab)** and click **Join ward**. The
  header must show **Live** and **sandbox**, and no **MOCK** badge. You are now on the real
  server, in a room of your own.
- If the page says **Backend unreachable**, look at the address bar: the application must run on
  port **4200**.
- If the server is not available, everything below also works with in-memory data: open
  `http://localhost:4200/ward?mock` instead (in every new tab).
- Topics are switched in the **⚡ Perf** panel: the button is in the **bottom right** corner.
  Switching a topic reloads the page. When a topic is on ❌ the button says **❌ bad on**.
- The panel is taller than the window. The **Gauges** section is at the very bottom: scroll
  inside the panel.
- Open DevTools in a **separate window** (⋮ → Dock side → undock). Docked at the bottom, it hides
  parts of the app's own panels.
- All file paths below are inside `apps/ward/src/app/`.

**Before every exercise:** in the ⚡ Perf panel click **all ✅**, set **Stress** to **×1**, then
switch only that exercise's topic to ❌.

Write your numbers here:

| Exercise         | Metric                           | ❌ before | after your fix |
| ---------------- | -------------------------------- | --------- | -------------- |
| 1 · wall         | tasks with a red corner          |           |                |
| 2 · burst        | seconds to deliver 3,000         |           |                |
| 3 · leak         | `_BedDetail` # Delta             |           |                |
| 4 · growing list | `{bed, …}` # Delta in about 30 s |           |                |

---

## 1 · A wall on the main thread

**Topic:** Heavy calculation on the main thread → ❌. **Page:** nurse station.

**Measure**

1. DevTools → **Performance**. Open the panel's settings (the gear icon in the panel's own
   toolbar) and set **CPU throttling** to 4× slowdown. Keep DevTools open: throttling only works
   while it is open.
2. Click the round **Record** button (not "Record and reload"). Wait 5 seconds. Click **Stop**.
3. In the **Main** track, count the tasks with a red corner. Skip the very first one: it is the
   recording starting. That is your number.
4. At the bottom of the panel open the **Bottom-up** tab and sort by **Self time**. Write down the
   function at the top and its file and line. (It may be an unnamed function from the same file.)

**Find**

That file is `ward/trends/hr-trend.ts`: the calculation itself. Now open, in your editor,
`ward/trends/hr-trends.ts` (with an **s**) and find the method `onMainThread()`. This is where
the calculation is called, for every bed. The frames of all 18 beds are held back until a shared
one-second tick, so all 18 calculations run together, in one task.

**Fix**

A 3-minute trend barely changes in one second. Make each bed's stream pass a value on at most
once every 10 seconds, before the trend is calculated. RxJS has an operator that emits the latest
value on a fixed interval. `onMainThread()` has two `pipe` calls. Use the first one, directly
after `snapshotThenStream(...)`. It already holds two operators, `sample` and `map`: add yours as
the first one, before `sample`. Import it from `rxjs`.

**Measure again**

1. Save. The page reloads. The trends show **Calculating…** for the first 10 seconds: that is
   your fix working, not a bug.
2. When the trends are back, record for **15 seconds**. Count the red corners again. You should
   find 1 or 2 instead of about 15.

The trend now refreshes every 10 seconds instead of every second. Is that acceptable for a nurse?

**Compare:** switch the topic to ✅ and record once more. One of the **Worker** tracks now has
activity once a second. Which approach changed less code? Which one keeps the trend fresh?

---

## 2 · A burst of messages

**Topic:** Message burst after reconnect → ❌. **Stress:** ×5 (the buttons are in the ⚡ Perf
panel, under the topics). **Page:** nurse station.

**Measure**

1. Open the **⚡ Perf** panel, scroll to **Gauges** and find `burst · messages delivered`. It
   shows 0. The panel refreshes once a second, so your result is exact to about a second.
2. DevTools → Performance → **CPU throttling** 4× slowdown. Do not record. Keep DevTools open.
3. Open **🛠 Dev** (bottom left), click **Burst 3000 msgs** and start a stopwatch.
4. Stop it when the gauge reaches 3000. That is your number.

The gauge does not go back to 0. Reload the page before you measure again.

The burst is simulated in your browser: nothing is sent to the server, and nobody else sees it.
For a moment the tiles show made-up values.

**Find**

Open `ward/ui/bed-tile.ts` and find the `vitals` resource. Read the ❌ branch: what happens to a
tile for each message?

**Fix**

A tile can only show the latest frame. In the ❌ branch, let at most one frame per display frame
through, and drop the rest. RxJS has an operator that waits for a period of time and then emits
the latest value; use it with a period of 0 and the scheduler that runs on animation frames.

**Measure again:** reload, then the same stopwatch. The burst should finish clearly faster.
How many times faster depends on your machine: write down your own number.

**Your own application:** which screens need **every** message, and which only the **latest**?

---

## 3 · A page that never leaves

**Topic:** Forgotten subscribe() → ❌. **Page:** start on the nurse station.

**See it first**

Click a bed tile, wait for the page, then go back (the browser's Back button or **← Ward**).
Look at the title of the browser tab: it still shows that bed's heart rate, and it keeps
changing. Something from the page you left is still running.

**Measure**

1. DevTools → **Memory** → **Heap snapshot** → **Take snapshot**.
2. Open a bed and go back. Do this 5 times.
3. Click the bin icon (**Collect garbage**).
4. Take a second snapshot (the round record button, top left of the panel).
5. Above the table of the second snapshot there is a dropdown that says **Summary**. Change it to
   **Comparison**.
6. Type `_BedDetail` into **Filter by class**. Write down **# Delta**.

**Find**

1. Expand the `_BedDetail` row and click one of the objects under it.
2. Look at the **Retainers** panel at the bottom (not at the link in the row you clicked). Read
   it from the top down: it is the chain of objects that keeps this page alive. Find the first
   row with a link to a file of this application. Write down the file and line.

**Fix**

Open that line. A subscription is started there and never ended. Make it end when the component
is destroyed: Angular's RxJS interop package has an operator for exactly this, and this file
already imports it. The line has no `pipe` yet: add one before `subscribe`, with that operator
in it.

**Measure again**

1. Save. The page reloads.
2. In the Memory panel remove the old snapshots (the **Clear all profiles** icon).
3. Repeat steps 1–6. The list should be empty. The tab title should stop changing after you
   leave a bed.

**Your own application:** which of your screens start a subscription by hand?

---

## 4 · A list that grows while you stay

**Topic:** Live buffer that only grows → ❌. **Page:** a bed (click a tile and stay there).

**Measure**

1. **⚡ Perf** panel → **Gauges** → `vitals buffer · frames`. Watch it for 10 seconds.
2. DevTools → **Memory** → take a heap snapshot.
3. Wait about 30 seconds. Take a second snapshot.
4. Change **Summary** to **Comparison** and type `bed` into **Filter by class**.
5. Write down **# New**, **# Deleted** and **# Delta** of the row `{bed, ts, hr, spo2, rr}`.

**Find**

Open `ward/bed-detail/snapshot-then-stream.ts` and find the function `keep`. Read the ❌ branch.
The chart draws the last 10 minutes: 600 frames.

**Fix**

In the ❌ branch of `keep`, return only the last `VITALS_WINDOW` frames of the array.

**Measure again:** the gauge stays at 600. In the comparison, # New and # Deleted are equal.

**Think about it:** nothing was "forgotten" here. Leaving the page frees everything. The method
from exercise 3 (go in, go out, compare) would find nothing. This problem only exists while the
screen stays open, and a monitoring screen stays open for a whole shift.

---

## Take this with you

| You see                                    | Tool                                   | Usual cause                            | Fix                                       |
| ------------------------------------------ | -------------------------------------- | -------------------------------------- | ----------------------------------------- |
| The screen freezes for a moment, regularly | Performance → Bottom-up, Self time     | a heavy calculation per message        | less often, a cheaper algorithm, a worker |
| The screen is slow after a reconnect       | a counter and a stopwatch              | one render per message                 | keep the latest value per display frame   |
| Memory grows as you navigate               | Memory → Comparison → Retainers        | a subscription or listener never ended | end it with the component                 |
| Memory grows while you stay on one screen  | a counter, or two snapshots 30 s apart | a list with no limit                   | keep only what the screen shows           |
