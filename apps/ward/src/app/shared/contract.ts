// src/shared/contract.ts — pure TypeScript. Shared by the Angular app and the backend.

// ---------- Step 1: literal types ----------
export const WARDS = ['ICU', 'ER', 'CARD'] as const;
export const BED_NUMBERS = [1, 2, 3, 4, 5, 6] as const;
export const VITALS = ['hr', 'spo2', 'rr', 'temp'] as const;

export type Ward = (typeof WARDS)[number];
export type BedNo = (typeof BED_NUMBERS)[number];
export type Vital = (typeof VITALS)[number];

export type BedId = `${Ward}-${BedNo}`;
export type BedSlug = Lowercase<BedId>;
export type NurseId = `nurse_${string}`;
export type DoctorId = `dr_${string}`;
export type AlarmId = `alarm_${string}`;
export type MedOrderId = `med_${string}`;
export type PatientId = `pat_${string}`;

export type AlarmLevel = 'low' | 'high';
export type SnoozeMinutes = 5 | 10 | 15;

// ---------- Step 3: derived vitals and alarm codes ----------
export type StreamedVital = Exclude<Vital, 'temp'>;
export type ManualVital = Extract<Vital, 'temp'>;
export type AlarmCode = Exclude<`${Vital}.${AlarmLevel}`, `temp.${string}` | 'spo2.high'>;
export const STREAMED_VITALS = VITALS.filter((v): v is StreamedVital => v !== 'temp');

// ---------- Payloads ----------
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

// ---------- Commands ----------
export interface Command { commandId: string; performedAt: string }

export type CommandResult<T = null> =
  | { status: 'accepted'; value: T }
  | { status: 'conflict'; by: NurseId; at: string }
  | { status: 'forbidden'; reason: string };

// ---------- The contract ----------
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

export type StreamName = keyof StreamContract;
export type RpcName = keyof RpcContract;

export type StreamDestination = {
  [K in StreamName]: `/${StreamContract[K]['channel']}/${K}.${StreamContract[K]['key']}`;
}[StreamName];
export type RpcDestination = `/app/${RpcName}`;

export type CommandName = {
  [K in RpcName]: RpcContract[K]['req'] extends Command ? K : never;
}[RpcName];

// ---------- Step 4: infer ----------
export type StreamNameOf<D> =
  D extends `/${string}/${infer K extends StreamName}.${string}` ? K : never;
export type PayloadOf<D extends StreamDestination> = StreamContract[StreamNameOf<D>]['payload'];
export type AcceptedValue<R> = R extends { status: 'accepted'; value: infer V } ? V : never;
export type RpcResult<K extends RpcName> = NonNullable<RpcContract[K]['res']>;

// ---------- Step 2: guards ----------
const isWard = (v: string): v is Ward => (WARDS as readonly string[]).includes(v);

export const isBedId = (v: string): v is BedId => {
  const [ward, no] = v.split('-');
  return !!ward && isWard(ward) && BED_NUMBERS.some((n) => String(n) === no);
};
export const isNurseId = (v: string): v is NurseId => v.startsWith('nurse_') && v.length > 6;
export const isDoctorId = (v: string): v is DoctorId => v.startsWith('dr_') && v.length > 3;
export const isAlarmId = (v: string): v is AlarmId => v.startsWith('alarm_') && v.length > 6;
export const isMedOrderId = (v: string): v is MedOrderId => v.startsWith('med_') && v.length > 4;
export const isPatientId = (v: string): v is PatientId => v.startsWith('pat_') && v.length > 4;
export const isAlarmCode = (v: string): v is AlarmCode => /^(hr\.(low|high)|spo2\.low|rr\.(low|high))$/.test(v);

export const bedFromSlug = (slug: string): BedId | null => {
  const id = slug.toUpperCase();
  return isBedId(id) ? id : null;
};

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
