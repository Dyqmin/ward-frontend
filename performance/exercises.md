# Exercises: measure, find, fix, measure again

Two exercises you do yourself, and two demos you watch. The exercises follow the same five steps:

1. **Measure** with Chrome DevTools and write the number down.
2. **Find** the line of code: DevTools gives you a link to it.
3. **Fix** that code.
4. **Measure again**, the same way. The number must move.
5. **Compare** your fix with the finished one in the same file.

## Setup

1. Run `pnpm start`. The application must run on port **4200**.
2. Open `http://localhost:4200/ward`.
3. Type any name. Leave the room code as it is. Choose the role **Nurse**. Tick **Use my private
   sandbox room (for the lab)**. Click **Join ward**.
4. Check the header: it must show **Live** and **sandbox**.
5. Open Chrome DevTools in a **separate window**: the ⋮ menu of DevTools → **Dock side** → the
   first icon (undock).

If the page says **Backend unreachable**, look at the address bar: the port must be 4200.

All file paths below are inside `apps/ward/src/app/`.

### How a problem is switched on

Every problem in this application can be switched on and off.

1. Click the **⚡ Perf** button in the **bottom right** corner of the page. A panel opens with a
   list of problems. Each one has two buttons: **❌** (the problem is on) and **✅** (it is off).
2. Click **❌** next to a problem. The page reloads. The button now says **⚡ Perf · ❌ bad on**.
3. To switch everything off again, click **all ✅** at the top of the panel.

Every one of these clicks reloads the page and closes the panel. Click **⚡ Perf** again to open it.

In the code, both versions are next to each other: the ❌ version is marked `❌ BAD`, the finished one `✅ GOOD`. You will change the ❌ version. The finished one is often only a few lines below: write your own change first, then compare.

Write your numbers here:

| Exercise                | What you count                         | Before | After your fix |
| ----------------------- | -------------------------------------- | ------ | -------------- |
| 1 · a wall              | tasks with a red corner in 15 seconds  |        |                |
| 2 · a page never leaves | `_BedDetail` in the column **# Delta** |        |                |

---

## Exercise 1 · A wall on the main thread

The nurse station shows a heart-rate trend for every bed. Something about it makes the page
freeze for a moment, again and again.

### Switch the problem on

1. Click **⚡ Perf** → **all ✅**. The page reloads and the panel closes.
2. Click **⚡ Perf** again. In the list, find **Heavy calculation on the main thread** and click its **❌**.
3. Stay on the nurse station (the first page, with all the beds).

### Measure

1. In DevTools open the **Performance** tab.
2. On the right side of that tab, under **Environment settings**, find the list labelled **CPU:** and choose **4× slowdown**. (The same list is behind the gear icon at the right end of the Performance toolbar, not the gear at the top of DevTools.) A warning triangle appears on the Performance tab: that is expected. Your laptop is faster than the computer on the ward; this makes it comparable.
3. Click the round **Record** button. Wait **15 seconds**. Click **Stop**. The first time, a box called **Keyboard shortcuts for flame chart** covers part of the chart: close it with ×.
4. Look at the row called **Main**. Each grey block at the top of it is one task: one piece of
   work the page did without a break. A task with a **red corner** took longer than 50 ms, and
   the page could not react to a click during that time.
5. Count the tasks with a red corner. Skip the very first one (that is the recording starting) and one that is cut off at the very end. You should find about 15: one per second. Write the number down.

### Find

1. At the bottom of the Performance tab click **Bottom-up**.
2. Look at the column **Self time**. The arrow next to its name must point down (▼), so the largest number is at the top. It usually is already; click the column only if the arrow points up. This list answers the question "which function used the most time?".
3. Read the first row: the function name and, directly after it, a link with a file name and a line number. You should see `hrTrend` and `hr-trend.ts`. Write them down.
4. That file contains the calculation. It is called from another file: open
   `ward/trends/hr-trends.ts` (with an **s**) in your editor and find the method
   `onMainThread()`. Read the comment marked `❌ BAD` above it.

### Fix

A 3-minute trend does not change much in one second, but it is calculated every second.

1. In `onMainThread()` find the first `.pipe(` — the one directly after
   `snapshotThenStream(...)`. It holds two operators: `sample` and `map`.
2. Add the RxJS operator `sampleTime` as the **first** operator in that `pipe`, before `sample`.
   Give it 10 000 milliseconds.
3. Add `sampleTime` to the import from `rxjs` at the top of the file.
4. Save. The page reloads.

### Measure again

1. For the first 10 seconds the trends say **Calculating…**. That is your fix: the first value
   now arrives after 10 seconds.
2. When the trends are back, record for **15 seconds** again and count the red corners. You should find 1 or 2 instead of about 15.

### Compare

1. Click **⚡ Perf** and switch **Heavy calculation on the main thread** to **✅**.
2. Record for 5 seconds once more. Find the row that starts with **Worker** and has activity once a second.
3. Read the method `inWorker()` in the same file.

Your fix was one line, but the trend is now up to 10 seconds old. The finished version moves the
calculation to another thread: more code, but the trend stays fresh. Which one would you choose
for a screen a nurse watches?

Before you go on: set **CPU:** back to **No throttling**.

---

## Demo · A burst of messages

Watch the trainer. After a lost connection, a message broker delivers everything it queued:
thousands of messages, one after another.

What to look at:

- The whole recording is one solid block: the page is busy from the first message to the last.
- In **Bottom-up** the first rows are **Layout** and **Paint**. The time goes into drawing, not
  into calculating.
- A bed tile is drawn again for every message, although it can only show the latest value.

Question for your own application: which screens need **every** message, and which only the
**latest**?

---

## Exercise 2 · A page that never leaves

A nurse opens a bed, looks at it and goes back to the nurse station. The page of that bed should
be gone from memory. Is it?

### Switch the problem on

1. Click **⚡ Perf** → **all ✅**. The page reloads and the panel closes.
2. Click **⚡ Perf** again. In the list, find **Forgotten subscribe()** and click its **❌**.
3. Stay on the nurse station.

### See it first

1. Click a bed tile. Wait until the page of the bed is shown.
2. Go back with the browser's Back button.
3. Look at the title of the browser tab of the application (not of the DevTools window). It still shows the heart rate of that bed, and it keeps
   changing. Something from the page you left is still running.

### Measure

A heap snapshot is a list of everything the page keeps in memory at one moment. You will take
two and compare them.

1. In DevTools open the **Memory** tab. **Heap snapshot** is already selected. Click the blue **Take snapshot** button at the bottom of the tab.
2. In the application, open a bed and go back. Do this **5 times**.
3. In the toolbar of the Memory tab click the broom icon (its tooltip says **Collect garbage**). It removes everything that is
   really free, so what remains is kept by something.
4. Take a second snapshot: the round button at the top left of the Memory tab.
5. The second snapshot is shown. Above the table there is a dropdown that says **Summary**.
   Change it to **Comparison**. The table now shows what changed between the two snapshots.
6. Click **Filter by class** and type `_BedDetail`. That is the component of the bed page.
7. Read the column **# Delta**: how many more of them exist now. Write the number down.

### Find

1. Click the small triangle in front of `_BedDetail`, then click one of the rows under it. Ignore the link in that row: it shows where the object was created, not who keeps it.
2. Look at the **Retainers** panel at the bottom of the tab; drag its top edge up to make it taller. It answers the question "who keeps
   this object in memory?". Read it from the top down.
3. In the Retainers panel, find the first row with a link to a file of this application (it is the second row). Write down the file name and the line number.

### Fix

1. Open that file at that line. A subscription is started there with `subscribe`, and nothing
   ever ends it.
2. Make the subscription end when the component is destroyed. Angular has an operator for this:
   `takeUntilDestroyed`, from `@angular/core/rxjs-interop`. The file already imports it.
3. The line has no `.pipe(` yet. Add one before `.subscribe(`, with `takeUntilDestroyed()` in it.
4. Save. The page reloads.

### Measure again

1. In the Memory tab remove the old snapshots (the **Clear all profiles** icon).
2. Repeat all seven steps of **Measure**. The table should be empty after step 6: write 0.
3. Open a bed and go back: the title of the tab should return to the nurse station.

### Compare

Read the `✅ GOOD` version a few lines below your change. Is yours the same?

Question for your own application: which components call `subscribe` by hand?

---

## Demo · A list that grows while you stay

Watch the trainer. This time nothing is left behind after leaving a page. The problem only exists
while a screen stays open, and a monitoring screen stays open for a whole shift.

What to look at:

- On the page of one bed, in the **⚡ Perf** panel (section **Gauges**, at the very bottom), the counter `vitals buffer · frames` goes up by one every second.
- Two heap snapshots, 30 seconds apart, compared: 30 new readings arrived, and none was removed.
- The method from exercise 2 (go in, go out, compare) finds nothing here. You have to stay on
  the screen and count.

---

## Take this with you

| You see                                    | Tool                               | Usual cause                            | Fix                                       |
| ------------------------------------------ | ---------------------------------- | -------------------------------------- | ----------------------------------------- |
| The screen freezes for a moment, regularly | Performance → Bottom-up, Self time | a heavy calculation per message        | less often, a cheaper algorithm, a worker |
| The screen is slow after a reconnect       | Performance → Bottom-up            | one redraw per message                 | keep the latest value per display frame   |
| Memory grows as you navigate               | Memory → Comparison → Retainers    | a subscription or listener never ended | end it with the component                 |
| Memory grows while you stay on one screen  | two snapshots 30 seconds apart     | a list with no limit                   | keep only what the screen shows           |
