// Type checks for the TypeScript block exercises. Do not import this file.
// Done when this passes: npx tsc -p apps/ward/tsconfig.app.json --noEmit
// "Unused '@ts-expect-error' directive" = a bad case compiled, so the type is too wide.
import { WARDS, type AlarmId, type AlarmLevel, type BedId, type BedSlug, type DoctorId,
  type MedOrderId, type NurseId, type PatientId, type SnoozeMinutes, type Vital } from './contract';

// ---------- Step 1 · Exercise 1: literal types ----------
// Every line without a directive must compile; every line under @ts-expect-error must NOT.
// Instructions: the STEP 1 block at the top of shared/contract.ts.
export const step1 = () => {
  const bed: BedId = 'ICU-3';
  // @ts-expect-error there is no bed 9
  const noSuchBed: BedId = 'ICU-9';
  // @ts-expect-error case matters
  const lowerBed: BedId = 'icu-3';
  const slug: BedSlug = 'icu-3';

  const vital: Vital = 'spo2';
  // @ts-expect-error no such vital
  const noSuchVital: Vital = 'glucose';

  const nurse: NurseId = 'nurse_anna';
  // @ts-expect-error missing prefix
  const noPrefix: NurseId = 'anna';
  const doctor: DoctorId = 'dr_house';
  const alarm: AlarmId = 'alarm_1';
  const patient: PatientId = 'pat_7';
  const order: MedOrderId = 'med_1';

  const level: AlarmLevel = 'high';
  // @ts-expect-error only low or high
  const noSuchLevel: AlarmLevel = 'medium';
  const snooze: SnoozeMinutes = 10;
  // @ts-expect-error snooze is 5, 10 or 15 minutes
  const longSnooze: SnoozeMinutes = 20;

  // @ts-expect-error the ward list is read-only
  WARDS.push('OR');

  return [bed, noSuchBed, lowerBed, slug, vital, noSuchVital, nurse, noPrefix, doctor, alarm,
    patient, order, level, noSuchLevel, snooze, longSnooze];
};
