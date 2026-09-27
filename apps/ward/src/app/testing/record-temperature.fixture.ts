// LAB TASK 1 · the mock ward's reply to 'vitals.record'. Instructions: DAY1-ANGULAR-EXERCISE.md.
// createWardFixtures() (ward-fixtures.ts) already plugs this function in; you only fill in its body.

import { isNurseId, type MockFixtures } from '../core/messaging/contract';
import type { MockWard } from './ward-fixtures';

/** The reply's type comes from the contract: a wrong status or a missing field does not compile. */
type VitalsRecordReply = NonNullable<
  MockFixtures['replies']['/app/vitals.record']
>;

export const recordTemperature =
  (ward: MockWard): VitalsRecordReply =>
  ({ bed, vital, value, performedAt }, ctx) => {
    // 1. only nurses – isNurseId narrows ctx.actor to NurseId for `by` below
    if (!ctx.actor || !isNurseId(ctx.actor))
      return { status: 'forbidden', reason: 'Only nurses can record vitals' };
    // 2. an occupied bed
    if (!ward.patients.has(bed))
      return { status: 'forbidden', reason: `Bed ${bed} is empty` };
    // 3. a plausible value
    if (value < 30 || value > 43)
      return { status: 'forbidden', reason: 'Implausible value' };
    // stretch: another nurse recorded this bed less than 60 s ago
    const last = ward.readings.get(bed)?.at(-1);
    if (last && last.by !== ctx.actor && ctx.now - Date.parse(last.at) < 60_000)
      return { status: 'conflict', by: last.by, at: last.at };
    // 4. store it
    ward.readings.set(bed, [
      ...(ward.readings.get(bed) ?? []),
      { bed, vital, value, by: ctx.actor, at: performedAt },
    ]);
    return { status: 'accepted', value: null };
  };
