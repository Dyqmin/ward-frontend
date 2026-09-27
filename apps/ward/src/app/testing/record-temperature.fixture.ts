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
    // 1. Only nurses. ctx.actor is who sent the command (or null). Check it with isNurseId, this
    //    morning's Step 2a guard, so TypeScript knows it is a NurseId afterwards. Anyone else:
    //    return { status: 'forbidden', reason: 'Only nurses can record vitals' }.
    // 2. An empty bed (ward.patients has no entry for `bed`) is forbidden too.
    // 3. value below 30 or above 43 → { status: 'forbidden', reason: 'Implausible value' }.
    // 4. Otherwise add { bed, vital, value, by: ctx.actor, at: performedAt } to the bed's list in
    //    ward.readings, and return { status: 'accepted', value: null }.
    return { status: 'forbidden', reason: 'LAB TASK 1: not implemented yet' };
  };
