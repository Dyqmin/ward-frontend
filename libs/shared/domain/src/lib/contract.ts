// src/shared/contract.ts — pure TypeScript. Shared by the Angular app and the backend.
//
// ============================================================================================
//  DAY 1 · TYPESCRIPT BLOCK — ROADMAP
// ============================================================================================
//  The steps build on each other; work through them in order. Each step starts in THIS file and
//  continues in core/messaging/contract.ts, where the Angular app builds on these types (look
//  for the "Step N · app layer" headings there).
//
//  Step 1  Literal types                  ← EXERCISE 1
//  Step 2  Type guards                    ← EXERCISE 2: isBedId (the rest of Step 2 is done)
//  Step 3  Derived & mapped types         ← EXERCISE 3: utility types (the rest of Step 3 is done)
//  Step 4  Conditional types & infer      ← already implemented: read it
//
//  Check your work at any time:
//    npx tsc -p apps/ward/tsconfig.app.json --noEmit
//        Exercises 1 and 3. Expectations: shared/contract.checks.ts. Both exercises share this
//        one run, so it reaches 0 errors only when both are done.
//    npx vitest run --globals apps/ward/src/app/shared/is-bed-id.spec.ts
//        Exercise 2. Runs on its own, even while tsc still reports errors.
//  Everything that is not an exercise is implemented: read it as a walkthrough of where the
//  exercises lead.
// ============================================================================================


// ============================================================================================
//  STEP 1 · LITERAL TYPES                                                         EXERCISE 1
// ============================================================================================
//  Goal: `string` and `number` accept anything, so today 'ICU-9', 'icu-3' or 'glucose' all compile
//  and bugs reach the ward at runtime. Make every identifier in the domain an EXACT type, so a
//  typo becomes a compile error instead of a missing alarm.
//
//  Rules:
//   • Derive, don't repeat. Each union must come from its array, so adding 'NEURO' to WARDS
//     updates every type below with no other edit.
//   • Keep the arrays usable at runtime: guards in Step 2 iterate over them.
//   • Only edit the Step 1 block, and don't edit contract.checks.ts.
//
//  Done when `npx tsc -p apps/ward/tsconfig.app.json --noEmit` reports no errors in the step1
//  block of contract.checks.ts. It starts at 21 errors; after Exercise 1 the 15 that remain all
//  belong to Exercise 3 (step3 block, ward-fixtures.ts, vitals-chart.ts and
//  core/messaging/contract.ts). Leave those for now.
//  "Unused '@ts-expect-error'" means a bad value compiled: the type is still too wide.
//
//  Tools: `as const`, indexed access `(typeof X)[number]`, template literal types, `Lowercase<>`.
// --------------------------------------------------------------------------------------------

// ---------- Step 1a · Unions from runtime arrays ----------
export const WARDS = ['ICU', 'ER', 'CARD'] as const;
export const BED_NUMBERS = [1, 2, 3, 4, 5, 6] as const;
export const VITALS = ['hr', 'spo2', 'rr', 'temp'] as const;

export type Ward = (typeof WARDS)[number];
export type BedNo = (typeof BED_NUMBERS)[number];
export type Vital = (typeof VITALS)[number];

// ---------- Step 1b · Template literal types ----------
export type BedId = `${Ward}-${BedNo}`;
export type BedSlug = Lowercase<BedId>;
export type NurseId = `nurse_${string}`;
export type DoctorId = `dr_${string}`;
export type AlarmId = `alarm_${string}`;
export type MedOrderId = `med_${string}`;
export type PatientId = `pat_${string}`;

// ---------- Step 1c · Plain literal unions ----------
export type AlarmLevel = 'low' | 'high';
export type SnoozeMinutes = 5 | 10 | 15;

// App layer (core/messaging/contract.ts): ALL_BEDS, wardOf(), toSlug() — runtime helpers typed
// with the literal types above.


// ============================================================================================
//  STEP 2 · TYPE GUARDS
// ============================================================================================
//  Goal: data from the URL, the socket or a request body is `unknown` or `string`. A guard is
//  the only honest way to turn it into a Step 1 type: it checks at runtime and narrows at
//  compile time, so no `as BedId` is ever needed.
//
//  Look for: `v is BedId` return types; guards built on the Step 1 arrays (one source of truth);
//  `in` narrowing for objects; `switch` on a discriminant (`status`) inside isAlarmEvent;
//  `assertNever`, which the app puts in the `default` of every switch over a union.
//  Try: add `| { status: 'queued' }` to CommandResult (Step 3c). Every switch that ends in
//  assertNever (medication-list, review-step, temperature-form, alarm-actions) stops compiling until
//  the new status is handled. Undo it afterwards.
//
//  EXERCISE 2 · isBedId (Step 2a below). Do it after Exercise 1: while BedId is `string`, the
//  guard has nothing to narrow to.
//  Implement isBedId so it accepts exactly the 18 ids of BedId ('ICU-1' … 'CARD-6') and nothing
//  else:
//   • Build it on WARDS and BED_NUMBERS (isWard is already there). Never list the beds by hand:
//     adding a ward to WARDS must update the type and the guard together.
//   • Exact matches only. All of these are false: 'icu-3' (case), 'ICU-9' and 'ICU-0' (no such
//     bed), 'ICU-03', 'ICU-', '' and 'ICU-3-1' (anything after the number).
//   • Keep the signature `(v: string): v is BedId`. bedFromSlug, isVitalsFrame and the request
//     guards rely on it to narrow.
//  Why tests and not tsc: `v is BedId` is a promise TypeScript does not verify. A guard that lies
//  compiles fine, so the proof is in shared/is-bed-id.spec.ts.
//  Done when this is green:
//    npx vitest run --globals apps/ward/src/app/shared/is-bed-id.spec.ts
//  Until then every bed is unknown to the app: bed URLs redirect back to /ward and live vitals
//  frames fail their guard.
// --------------------------------------------------------------------------------------------

// ---------- Step 2a · Primitive guards: string → literal type ----------
const isWard = (v: string): v is Ward => (WARDS as readonly string[]).includes(v);

export const isBedId = (v: string): v is BedId => {
  const [ward, no, ...rest] = v.split('-');
  return (
    rest.length === 0 &&                      // exactly "WARD-N": 'ICU-3-1' is not a bed
    !!ward && isWard(ward) &&                 // from WARDS
    BED_NUMBERS.some((n) => String(n) === no) // from BED_NUMBERS; String() also rejects 'ICU-03'
  );
};
export const isNurseId = (v: string): v is NurseId => v.startsWith('nurse_') && v.length > 6;
export const isDoctorId = (v: string): v is DoctorId => v.startsWith('dr_') && v.length > 3;
export const isAlarmId = (v: string): v is AlarmId => v.startsWith('alarm_') && v.length > 6;
export const isMedOrderId = (v: string): v is MedOrderId => v.startsWith('med_') && v.length > 4;
export const isPatientId = (v: string): v is PatientId => v.startsWith('pat_') && v.length > 4;
export const isAlarmCode = (v: string): v is AlarmCode => /^(hr\.(low|high)|spo2\.low|rr\.(low|high))$/.test(v);

// ---------- Step 2b · Guards at the boundary: route slug → BedId | null ----------
export const bedFromSlug = (slug: string): BedId | null => {
  const id = slug.toUpperCase();
  return isBedId(id) ? id : null;
};

// ---------- Step 2c · Object guards and exhaustiveness ----------
export const isVitalsFrame = (x: unknown): x is VitalsFrame =>
  typeof x === 'object' && x !== null &&
  'bed' in x && typeof x.bed === 'string' && isBedId(x.bed) &&
  'ts' in x && typeof x.ts === 'number' &&
  STREAMED_VITALS.every((k) => typeof (x as Record<string, unknown>)[k] === 'number');

export function isAlarmEvent(x: unknown): x is AlarmEvent {
  if (typeof x !== 'object' || x === null) return false;
  if (!('status' in x) || !('alarmId' in x) || !('bed' in x)) return false;
  if (typeof x.alarmId !== 'string' || !isAlarmId(x.alarmId)) return false;
  if (typeof x.bed !== 'string' || !isBedId(x.bed)) return false;
  switch (x.status) {
    case 'raised':       return 'code' in x && typeof x.code === 'string' && isAlarmCode(x.code)
                             && 'value' in x && typeof x.value === 'number';
    case 'acknowledged': return 'by' in x && typeof x.by === 'string' && isNurseId(x.by)
                             && 'at' in x && typeof x.at === 'string';
    case 'snoozed':      return 'by' in x && typeof x.by === 'string' && isNurseId(x.by)
                             && 'until' in x && typeof x.until === 'string';
    case 'escalated':    return 'to' in x && x.to === 'doctor';
    default:             return false;
  }
}

export const assertNever = (x: never): never => { throw new Error(`Unhandled: ${JSON.stringify(x)}`); };

// App layer (core/messaging/contract.ts): parseFrame() + FRAME_GUARDS — every socket frame goes
// through a guard.


// ============================================================================================
//  STEP 3 · DERIVED & MAPPED TYPES
// ============================================================================================
//  Goal: write each fact once and compute the rest. Vitals split into streamed and manual,
//  alarm codes are generated from vitals × levels, payloads reuse the ids, and the whole
//  messaging surface is one interface that destinations and command names are derived from.
//
//  Look for: template literal types over unions (every combination at once, see AlarmCode);
//  intersections; discriminated unions; generic defaults (`CommandResult<T = null>`); mapped
//  types with `[K in …]` and key filtering.
//
//  EXERCISE 3 · Utility types (Steps 3a, 3b and 3d below)
//  The five types marked "EXERCISE 3.x" were written by hand. Replace each one with a type
//  built from an existing type, using the proper utility type:
//
//   1. StreamedVital  – from Vital, remove 'temp'.
//   2. ManualVital    – from Vital, keep only 'temp'.
//   3. VitalsFrame    – { bed: BedId; ts: number } plus a number field for every StreamedVital.
//   4. MedOrderDraft  – from MedOrder, remove id, status, orderedBy and createdAt
//                       (the server sets those).
//   5. 'medication.given' request – Command plus only the id field of MedOrder.
//
//  Don't write any union or field list by hand, and don't edit contract.checks.ts.
//  Done when `npx tsc -p apps/ward/tsconfig.app.json --noEmit` reports 0 errors (with
//  Exercise 1 done as well).
// --------------------------------------------------------------------------------------------

// ---------- Step 3a · Utility types on unions, template literals ----------
export type StreamedVital = Exclude<Vital, 'temp'>;
export type ManualVital = Extract<Vital, 'temp'>;
export type AlarmCode = Exclude<`${Vital}.${AlarmLevel}`, `temp.${string}` | 'spo2.high'>;
export const STREAMED_VITALS = VITALS.filter((v): v is StreamedVital => v !== 'temp');

// ---------- Step 3b · Payloads: intersections, discriminated unions ----------
export type VitalsFrame = { bed: BedId; ts: number } & Record<StreamedVital, number>;

export type AlarmEvent =
  | { status: 'raised';       alarmId: AlarmId; bed: BedId; code: AlarmCode; value: number }
  | { status: 'acknowledged'; alarmId: AlarmId; bed: BedId; by: NurseId; at: string }
  | { status: 'snoozed';      alarmId: AlarmId; bed: BedId; by: NurseId; until: string }
  | { status: 'escalated';    alarmId: AlarmId; bed: BedId; to: 'doctor' };

export interface Patient { id: PatientId; name: string; bed: BedId; admittedAt: string }

export interface MedOrder {
  id: MedOrderId; patientId: PatientId; drug: string; doseMg: number; route: 'oral' | 'iv';
  status: 'ordered' | 'given' | 'cancelled'; orderedBy: DoctorId; createdAt: string;
}
export type MedOrderDraft = Omit<MedOrder, 'id' | 'status' | 'orderedBy' | 'createdAt'>;

export interface ManualReading { bed: BedId; vital: ManualVital; value: number; by: NurseId; at: string }

// ---------- Step 3c · Commands: a generic result union ----------
export interface Command { commandId: string; performedAt: string }

export type CommandResult<T = null> =
  | { status: 'accepted'; value: T }
  | { status: 'conflict'; by: NurseId; at: string }
  | { status: 'forbidden'; reason: string };

// ---------- Step 3d · The contract: one interface per messaging pattern ----------
export interface StreamContract {
  vitals: { channel: 'topic'; key: BedId; payload: VitalsFrame };
  alarms: { channel: 'topic'; key: Ward;  payload: AlarmEvent };
}

export interface RpcContract {
  // queries
  'patients.get':     { req: { bed: BedId };                                             res: Patient | null };
  'vitals.history':   { req: { bed: BedId; minutes: 10 | 30 | 60 };                      res: VitalsFrame[] };
  'vitals.manual':    { req: { bed: BedId };                                             res: ManualReading[] };
  'medication.list':  { req: { bed: BedId };                                             res: MedOrder[] };
  'alarms.active':    { req: { ward: Ward };                                             res: AlarmEvent[] };
  // commands
  'alarms.ack':       { req: Command & { alarmId: AlarmId };                             res: CommandResult };
  'alarms.snooze':    { req: Command & { alarmId: AlarmId; minutes: SnoozeMinutes };     res: CommandResult<{ until: string }> };
  'vitals.record':    { req: Command & { bed: BedId; vital: ManualVital; value: number }; res: CommandResult };
  'medication.given': { req: Command & Pick<MedOrder, 'id'>;                             res: CommandResult };
  'medication.order': { req: Command & MedOrderDraft;                                    res: CommandResult<Pick<MedOrder, 'id'>> };
}

// ---------- Step 3e · Mapped types: destinations and command names from the contract ----------
export type StreamName = keyof StreamContract;
export type RpcName = keyof RpcContract;

export type StreamDestination = {
  [K in StreamName]: `/${StreamContract[K]['channel']}/${K}.${StreamContract[K]['key']}`;
}[StreamName];
export type RpcDestination = `/app/${RpcName}`;

export type CommandName = {
  [K in RpcName]: RpcContract[K]['req'] extends Command ? K : never;
}[RpcName];

// App layer (core/messaging/contract.ts): WardRpcContract and CommandBody — the app's own RPC
// surface, built the same way.


// ============================================================================================
//  STEP 4 · CONDITIONAL TYPES, INFER & GENERIC APIS
// ============================================================================================
//  Goal: let the compiler read types back out of values. From '/topic/vitals.ICU-3' TS infers
//  the stream name and therefore the payload, so `bus.watch(destination)` needs no type
//  argument and a wrong destination does not compile.
//
//  Look for: `extends … ? … : never`; `infer K extends StreamName` inside a template literal;
//  pulling a field out of a union member with `infer V`; `NonNullable`.
//  App layer (core/messaging/contract.ts): MessageBus.watch/request/send, type-checked mock
//  fixtures and link().
// --------------------------------------------------------------------------------------------

// ---------- Step 4a · Infer from a destination string ----------
export type StreamNameOf<D> =
  D extends `/${string}/${infer K extends StreamName}.${string}` ? K : never;
export type PayloadOf<D extends StreamDestination> = StreamContract[StreamNameOf<D>]['payload'];
// ---------- Step 4b · Infer from a result ----------
export type AcceptedValue<R> = R extends { status: 'accepted'; value: infer V } ? V : never;
export type RpcResult<K extends RpcName> = NonNullable<RpcContract[K]['res']>;


// ---------- Request guards (backend addition) ----------
// One guard per RPC. The mapped type makes a new entry in RpcContract a compile
// error here until its guard exists. The server validates every SEND body with these.

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
export const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
export const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && ISO_DATE.test(v) && Number.isFinite(Date.parse(v));
const oneOf = <T extends string | number>(allowed: readonly T[]) =>
  (v: unknown): v is T => (allowed as readonly unknown[]).includes(v);

export const SNOOZE_MINUTES = [5, 10, 15] as const satisfies readonly SnoozeMinutes[];
export const HISTORY_MINUTES = [10, 30, 60] as const;
export const MANUAL_VITALS = ['temp'] as const satisfies readonly ManualVital[];
export const MED_ROUTES = ['oral', 'iv'] as const satisfies readonly MedOrder['route'][];

const isSnoozeMinutes = oneOf(SNOOZE_MINUTES);
const isHistoryMinutes = oneOf(HISTORY_MINUTES);
const isManualVital = oneOf(MANUAL_VITALS);
const isMedRoute = oneOf(MED_ROUTES);

const hasBed = (x: Obj): boolean => typeof x.bed === 'string' && isBedId(x.bed);

export const isCommand = (x: unknown): x is Command & Obj =>
  isObj(x) && isNonEmptyString(x.commandId) && isIsoDate(x.performedAt);

type RequestGuards = { [K in RpcName]: (x: unknown) => x is RpcContract[K]['req'] };

export const REQUEST_GUARDS: RequestGuards = {
  'patients.get': (x): x is RpcContract['patients.get']['req'] => isObj(x) && hasBed(x),
  'vitals.history': (x): x is RpcContract['vitals.history']['req'] =>
    isObj(x) && hasBed(x) && isHistoryMinutes(x.minutes),
  'vitals.manual': (x): x is RpcContract['vitals.manual']['req'] => isObj(x) && hasBed(x),
  'medication.list': (x): x is RpcContract['medication.list']['req'] => isObj(x) && hasBed(x),
  'alarms.active': (x): x is RpcContract['alarms.active']['req'] =>
    isObj(x) && typeof x.ward === 'string' && isWard(x.ward),
  'alarms.ack': (x): x is RpcContract['alarms.ack']['req'] =>
    isCommand(x) && typeof x.alarmId === 'string' && isAlarmId(x.alarmId),
  'alarms.snooze': (x): x is RpcContract['alarms.snooze']['req'] =>
    isCommand(x) && typeof x.alarmId === 'string' && isAlarmId(x.alarmId) && isSnoozeMinutes(x.minutes),
  'vitals.record': (x): x is RpcContract['vitals.record']['req'] =>
    isCommand(x) && hasBed(x) && isManualVital(x.vital) && isFiniteNumber(x.value),
  'medication.given': (x): x is RpcContract['medication.given']['req'] =>
    isCommand(x) && typeof x.id === 'string' && isMedOrderId(x.id),
  'medication.order': (x): x is RpcContract['medication.order']['req'] =>
    isCommand(x) && typeof x.patientId === 'string' && isPatientId(x.patientId) &&
    isNonEmptyString(x.drug) && isFiniteNumber(x.doseMg) && isMedRoute(x.route),
};

export const isRpcName = (v: string): v is RpcName => Object.hasOwn(REQUEST_GUARDS, v);
export const isWardName = isWard;
