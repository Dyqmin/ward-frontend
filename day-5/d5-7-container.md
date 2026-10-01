# D5.7 · Split a component that does everything

**25 minutes**

`AlarmActions` draws an alarm with its buttons **and** sends the nurse's commands: it injects
`MessageBus`, `AuthStore` and `Toasts`. That makes it a **container**, and a container does not
belong in a `ui` library. Split it in two:

- **`AlarmRow`**, presentational, in `monitoring-ui`: gets the alarm through inputs, reports
  clicks through outputs, injects nothing;
- **`AlarmActions`**, the container, back in the ward app for now: injects the services, sends
  the commands, and draws itself with `AlarmRow`.

## Steps

### Move the files

1. In `libs/monitoring/ui/src/lib/`, create a folder `alarm-row/`. Move
   `alarm-actions/alarm-actions.html` into it as `alarm-row.html`, and
   `alarm-actions/alarm-actions.scss` as `alarm-row.scss`.
2. Move `alarm-actions/alarm-actions.ts` out of the library, into the ward app:
   `apps/ward/src/app/ward/alarm-actions/alarm-actions.ts`. Delete the empty folder in the
   library. Its selector goes back to the app's prefix, for now: `app-alarm-actions`, and so do the tags
   in `nurse-station.html`, `ward-rounds.html` and `bed-detail.html`. The three pages import
   `AlarmActions` from `../alarm-actions/alarm-actions`.

### The presentational half

3. Create `alarm-row/alarm-row.ts` with a component `AlarmRow`: selector `wm-alarm-row`,
   `templateUrl` and `styleUrl` pointing at the two files you moved. It injects nothing.
   - Inputs: `alarm` (required, type `AlarmView`); `canAct` (default `false`; when it is
     `true` the buttons show, because only nurses act); `pending` (default `false`; `true`
     while a command waits for the server).
   - Outputs: `acknowledge` (no value); `snooze` (value type `SnoozeMinutes`).
   - Move these members from `AlarmActions` to `AlarmRow`, unchanged: `snoozeOptions`, `title`,
     `status`, `urgent`, `canSnooze`. Leave `canAck` behind: the template uses `urgent` for
     the same thing. Import what they use: `alarmTitle`, `alarmStatus`, `isUrgent` and the
     type `AlarmView` from `@wm/monitoring/domain`; `SNOOZE_MINUTES` and the type
     `SnoozeMinutes` from `@wm/shared/domain`.
4. In `alarm-row.html`: `isNurse()` becomes `canAct()`, `canAck()` becomes `urgent()`, the
   Acknowledge button's click emits `acknowledge`, and a Snooze button's click emits `snooze`
   with its minutes (`m`).
5. In the ui library's `src/index.ts`, export `alarm-row` instead of `alarm-actions`.

### The container

6. In `AlarmActions`, keep the input `alarm`, the three injected services, `isNurse`, `pending`,
   `ack()`, `snooze()` and `run()`. Delete what moved to `AlarmRow`, and `canAck`. Remove the
   imports it no longer uses.
7. Replace its `templateUrl` and `styleUrl` with an inline `template` that holds one element,
   `wm-alarm-row`, with: `alarm` bound to `alarm()`, `canAct` bound to `isNurse()`, `pending`
   bound to `pending()`, the `acknowledge` event calling `ack()`, and the `snooze` event calling
   `snooze()` with the event's value (`$event`). Add `AlarmRow` (from `@wm/monitoring/ui`) to the
   component's `imports`.

## Check

- `grep -rn "inject(" libs/monitoring/ui libs/shared/ui-design-system` prints nothing.
- `pnpm lint` passes: no errors left.
- `pnpm day5:check 7`
- `pnpm start`: as a nurse, acknowledge and snooze an alarm ("pending sync…" shows until the
  server confirms). As a doctor, the alarms show without buttons.

## Questions

1. How would you test `AlarmRow`? Which providers does the test need?
2. `AlarmActions` is back in the app. Is that its final home?
