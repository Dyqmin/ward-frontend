# D5.1 · Read the graph, predict what a change affects

**15 minutes · nothing to code**

Nx knows which project imports which. From that graph it computes which projects a change can
break, and runs lint, tests and builds for those only. Today you change the graph on purpose,
so first learn to read it.

## Steps

1. Run `pnpm graph`. In the browser, click **Show all projects**.
2. Answer these in your notes:
   1. How many projects are there? Which of them are apps?
   2. Which library do the most projects import directly?
   3. Which libraries import no other project?
   4. The ward app has a big folder, `apps/ward/src/app/ward/`, with the nurse station, the bed
      screen, the alarms and the medication wizard. Where is it in the graph?
3. **Predict first, then run.** Write down which projects a change to
   `libs/shared/util-dates/src/lib/clock.ts` affects. Then run:

   ```sh
   pnpm nx show projects --affected --files=libs/shared/util-dates/src/lib/clock.ts
   ```

4. Same for `libs/shared/domain/src/lib/ward.ts`: predict, then run the same command with that
   file.
5. Compare the two lists with your predictions. For every project you did not predict, find the
   chain of imports in the graph that puts it on the list.

## Check

Your predictions match the lists, or you can explain each difference with an arrow in the graph.

## Questions

1. Why is `pharmacy` affected by a change to `shared/domain`, but not by a change to
   `shared/util-dates`?
2. Why is `shared-data-access-messaging` affected by `ward.ts` although you only changed
   `shared/domain`?
3. A change anywhere in `apps/ward/src/app/ward/` affects exactly one project. Is that good
   news or bad news?
