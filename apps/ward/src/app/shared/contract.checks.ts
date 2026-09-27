// Type checks for the TypeScript block exercises. Do not import this file.
// Checked by: npx tsc -p apps/ward/tsconfig.app.json --noEmit (0 errors once Exercises 1 and 3 are done)
// "Unused '@ts-expect-error' directive" = a bad case compiled, so the type is too wide.
import { WARDS, isBedId, type AlarmId, type ManualVital, type MedOrderDraft, type RpcContract,
  type StreamedVital, type VitalsFrame, type AlarmLevel, type BedId, type BedSlug, type DoctorId,
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

// ---------- Step 2 · Exercise 2: isBedId ----------
// The guard's logic is tested at runtime in shared/is-bed-id.spec.ts. Here we only check that it
// still narrows: if isBedId returned a plain boolean, `input` would stay a string.
export const step2 = (input: string): BedId | null => (isBedId(input) ? input : null);

// ---------- Step 3 · Exercise 3: utility types ----------
// Instructions: the STEP 3 block in shared/contract.ts.
export const step3 = () => {
  const streamed: StreamedVital = 'hr';
  // @ts-expect-error temperature is recorded by hand, not streamed
  const streamedTemp: StreamedVital = 'temp';
  const manual: ManualVital = 'temp';

  const frame: VitalsFrame = { bed: 'ICU-3', ts: 1, hr: 72, spo2: 97, rr: 14 };
  // @ts-expect-error a frame carries every streamed vital
  const noRr: VitalsFrame = { bed: 'ICU-3', ts: 1, hr: 72, spo2: 97 };

  const draft: MedOrderDraft = { patientId: 'pat_7', drug: 'heparin', doseMg: 5, route: 'iv' };
  // @ts-expect-error id is assigned by the server
  const withId: MedOrderDraft = { ...draft, id: 'med_1' };
  // @ts-expect-error route is 'oral' or 'iv'
  const badRoute: MedOrderDraft = { ...draft, route: 'im' };

  type Given = RpcContract['medication.given']['req'];
  // @ts-expect-error medication.given takes a MedOrderId
  const notAnOrderId: Given = { commandId: 'c1', performedAt: '2026-01-01', id: 'pat_7' };

  return [streamed, streamedTemp, manual, frame, noRr, draft, withId, badRoute, notAnOrderId];
};
