# Message burst after reconnect

**Where:** `ward/ui/bed-tile.ts` (`vitals`), and `FakeMessageBus.burst()` in
`core/messaging/fake-message-bus.ts`.

After an outage, a broker redelivers what it queued for durable subscribers (ActiveMQ does). Monitors
send several readings per second, so a few seconds offline is thousands of messages, back to back.
Each WebSocket message is its own task. Zoneless or not, a signal changed in a new task means a new
change detection run.

## See it

Set **Message burst after reconnect** to ❌. Nurse station, Dev toolbar → **Burst 3000 msgs** (an
outage triggers the same burst when it ends).

- **Performance panel:** a dense block of thin tasks for a second or more: a picket fence so dense
  it acts as a wall. Zoom in: every task is one message plus one render.
- **⚡ Perf → Calculations/s:** `BedTile · frames applied` ≈ the number of messages (≈ 3,000 vs
  ≈ 150 with ✅). Read it at Stress ×1 with no CPU throttling: the burst is over in half a second.
- **Template checks/s:** BedTile explodes for the duration of the burst.
- With ✅: the same 3000 messages, at most one render per tile per display frame.
- **To see it on the chart: Stress ×5, CPU ×4.** Now watch how long the burst takes, on the
  `burst · messages delivered` gauge: ≈ 25 s with ❌, ≈ 5 s with ✅. The per-second counters look
  alike here (≈ 900/s both), because with ❌ the thread is saturated: it cannot go any faster.
- **`pnpm bench ws-burst --stress 5`:** TBT is the same for ❌ and ✅ (there is no long task), the
  busy time is not. See [Comparing two approaches](19-compare.md).

## Why

```ts
// ❌ BAD: every message is a new value, a dirty view, a render
this.bus.watch(`/topic/vitals.${bed}`);

// ✅ GOOD: a tile shows the LATEST frame. Keep the latest per animation frame.
this.bus.watch(`/topic/vitals.${bed}`).pipe(auditTime(0, animationFrameScheduler));
```

| Consumer needs          | Operator                                                |
| ----------------------- | ------------------------------------------------------- |
| the latest value        | `auditTime(0, animationFrameScheduler)` or `sampleTime` |
| every value, in batches | `bufferTime(16)` + one `update()` per batch             |
| nothing after a gap     | ask for a fresh snapshot, drop the backlog              |

## Rules

- Decide per consumer: **latest** or **every**. Most screens need the latest.
- Never more renders than the display can show (~60/s).
- ActiveMQ: one wildcard subscription (`/topic/vitals.>`) instead of one per bed, and a consumer
  prefetch that matches what the client can process.
