# The hunt

`http://localhost:4200/ward?mock&perf=bad` — everything ❌.

**Don't read the notes or grep for `BAD`.** Use only the tools:
⚡ Perf panel, Angular DevTools, Performance, Performance monitor, Memory.

In pairs, 25 minutes. For each problem write one line:

| Symptom (what you saw) | Tool | Cause (file, line) | Fix |
| ---------------------- | ---- | ------------------ | --- |
|                        |      |                    |     |

There are 10 planted problems and 1 that was real. Then switch topics back to ✅ one by one and
check that your number moves.

## Bonus

- Run Lighthouse on `pnpm serve:prod`, everything ✅. What is the worst score left, and why?
- Profile the doctor's screen (Dev toolbar → role: doctor). Anything to fix there?
