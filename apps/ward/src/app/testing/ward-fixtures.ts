// testing/ward-fixtures.ts — the mock ward. All names and values are fictional and illustrative.
//
// `createWardFixtures()` returns a `MockFixtures` object whose replies share one in-memory ward:
// 18 beds, 15 patients, medication orders and an alarm engine that follows the vitals it streams.
// The type (`satisfies MockFixtures`) checks every payload against yesterday's contract.

import {
  ALL_BEDS,
  THRESHOLDS,
  wardOf,
  type AlarmCode,
  type AlarmEvent,
  type AlarmId,
  type BedId,
  type CommandResult,
  type DoctorId,
  type ManualReading,
  type MedOrder,
  type MedOrderId,
  type MockContext,
  type MockFixtures,
  type NurseId,
  type ParticipantId,
  type Patient,
  type PatientId,
  type VitalsFrame,
  type Ward,
} from '../core/messaging/contract';

/** The same three beds the backend keeps empty, for the "redirect on empty bed" demo. */
export const MOCK_EMPTY_BEDS: readonly BedId[] = ['ICU-6', 'ER-4', 'CARD-3'];

const NAMES = [
  'Bea Placebo',
  'Cal Ibration',
  'Dee Hydration',
  'Earl E. Bird',
  'Faye Kename',
  'Gus Tatory',
  "Hal O'Gen",
  'Ivy Drip',
  'Jo King',
  'Kay Pillary',
  'Lou Kocyte',
  'Mo Nitor',
  'Nell Ebulizer',
  'Otto Scope',
  'Pip Ette',
];

const DRUGS: readonly Pick<MedOrder, 'drug' | 'doseMg' | 'route'>[] = [
  { drug: 'Paracetamol', doseMg: 1000, route: 'oral' },
  { drug: 'Ondansetron', doseMg: 4, route: 'iv' },
  { drug: 'Amoxicillin', doseMg: 500, route: 'oral' },
  { drug: 'Metoprolol', doseMg: 25, route: 'oral' },
  { drug: 'Furosemide', doseMg: 40, route: 'iv' },
];

const SEED_DOCTOR: DoctorId = 'dr_grey_seed';

/** Alarm timings, shortened versions of the backend's. */
const ESCALATE_AFTER_MS = 20_000;
const END_AFTER_IN_RANGE_MS = 10_000;

interface AlarmRecord {
  alarmId: AlarmId;
  bed: BedId;
  code: AlarmCode;
  latest: AlarmEvent;
  raisedAt: number;
  inRangeSince: number | null;
}

const hash = (s: string) =>
  [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Deterministic vitals: every subscriber of a bed sees the same frame for the same second. */
export function mockFrame(
  bed: BedId,
  tick: number,
  hrOverride?: number,
): VitalsFrame {
  const h = hash(bed);
  let hr = Math.round(
    68 + (h % 16) + 4 * Math.sin(tick / 7 + h) + 2 * Math.sin(tick / 2.3),
  );
  // ICU-3 crosses the demo threshold for 15 s every 90 s
  if (bed === 'ICU-3' && tick % 90 >= 75) hr = 131 + ((tick % 90) - 75);
  if (hrOverride !== undefined)
    hr = Math.round(hrOverride + Math.sin(tick / 1.7));
  const spo2 = Math.min(
    100,
    Math.round(96 + (h % 3) + Math.sin(tick / 11 + h)),
  );
  const rr = Math.round(14 + (h % 4) + 1.5 * Math.sin(tick / 5 + h));
  return { bed, ts: tick * 1000, hr, spo2, rr };
}

function outOfRangeCodes(f: VitalsFrame): AlarmCode[] {
  const codes: AlarmCode[] = [];
  if (THRESHOLDS.hr.high !== undefined && f.hr > THRESHOLDS.hr.high)
    codes.push('hr.high');
  if (THRESHOLDS.hr.low !== undefined && f.hr < THRESHOLDS.hr.low)
    codes.push('hr.low');
  if (THRESHOLDS.spo2.low !== undefined && f.spo2 < THRESHOLDS.spo2.low)
    codes.push('spo2.low');
  if (THRESHOLDS.rr.high !== undefined && f.rr > THRESHOLDS.rr.high)
    codes.push('rr.high');
  if (THRESHOLDS.rr.low !== undefined && f.rr < THRESHOLDS.rr.low)
    codes.push('rr.low');
  return codes;
}

const valueOf = (f: VitalsFrame, code: AlarmCode): number =>
  f[code.split('.')[0] as 'hr' | 'spo2' | 'rr'];

const accepted = <T>(value: T): CommandResult<T> => ({
  status: 'accepted',
  value,
});
const forbidden = (
  reason: string,
): { status: 'forbidden'; reason: string } => ({ status: 'forbidden', reason });
const isNurse = (actor: ParticipantId | null): actor is NurseId =>
  !!actor?.startsWith('nurse_');
const isDoctor = (actor: ParticipantId | null): actor is DoctorId =>
  !!actor?.startsWith('dr_');

export class MockWard {
  readonly patients = new Map<BedId, Patient>();
  readonly orders = new Map<
    MedOrderId,
    MedOrder & { given?: { by: NurseId; at: string } }
  >();
  readonly readings = new Map<BedId, ManualReading[]>();
  readonly alarms = new Map<AlarmId, AlarmRecord>();
  /** monitor.set: the room game's heart-rate slider. */
  readonly hrOverrides = new Map<BedId, number>();
  private seq = 1;

  constructor() {
    let i = 0;
    for (const bed of ALL_BEDS) {
      if (MOCK_EMPTY_BEDS.includes(bed)) continue;
      const id: PatientId = `pat_${bed.toLowerCase().replace('-', '')}`;
      this.patients.set(bed, {
        id,
        name: NAMES[i % NAMES.length] ?? 'Patient',
        bed,
        admittedAt: new Date(
          Date.UTC(2026, 8, 18 + (i % 6), 8 + (i % 9)),
        ).toISOString(),
      });
      const drug = DRUGS[i % DRUGS.length];
      if (drug)
        this.addOrder(
          { patientId: id, ...drug },
          SEED_DOCTOR,
          new Date(Date.UTC(2026, 8, 24, 9, i)).toISOString(),
        );
      i++;
    }
  }

  patientById(id: PatientId): Patient | undefined {
    return [...this.patients.values()].find((p) => p.id === id);
  }

  addOrder(
    draft: Pick<MedOrder, 'patientId' | 'drug' | 'doseMg' | 'route'>,
    by: DoctorId,
    at: string,
  ): MedOrder {
    const order: MedOrder = {
      id: `med_${this.seq++}`,
      ...draft,
      status: 'ordered',
      orderedBy: by,
      createdAt: at,
    };
    this.orders.set(order.id, order);
    return order;
  }

  activeAlarms(ward: Ward): AlarmEvent[] {
    return [...this.alarms.values()]
      .filter((a) => wardOf(a.bed) === ward)
      .map((a) => a.latest);
  }

  /** The alarm engine: runs on every streamed frame of an occupied bed. */
  process(frame: VitalsFrame, ctx: MockContext): void {
    if (!this.patients.has(frame.bed)) return;
    const topic: `/topic/alarms.${Ward}` = `/topic/alarms.${wardOf(frame.bed)}`;
    const broadcast = (e: AlarmEvent, rec: AlarmRecord) => {
      rec.latest = e;
      ctx.emit(topic, e);
    };
    const out = outOfRangeCodes(frame);

    for (const code of out) {
      const existing = [...this.alarms.values()].some(
        (a) => a.bed === frame.bed && a.code === code,
      );
      if (existing) continue;
      const alarmId: AlarmId = `alarm_${frame.bed.toLowerCase()}_${code.replace('.', '_')}_${this.seq++}`;
      const event: AlarmEvent = {
        status: 'raised',
        alarmId,
        bed: frame.bed,
        code,
        value: valueOf(frame, code),
      };
      const rec: AlarmRecord = {
        alarmId,
        bed: frame.bed,
        code,
        latest: event,
        raisedAt: ctx.now,
        inRangeSince: null,
      };
      this.alarms.set(alarmId, rec);
      ctx.emit(topic, event);
    }

    for (const rec of [...this.alarms.values()].filter(
      (a) => a.bed === frame.bed,
    )) {
      const inRange = !out.includes(rec.code);
      switch (rec.latest.status) {
        case 'raised':
          if (ctx.now - rec.raisedAt > ESCALATE_AFTER_MS) {
            broadcast(
              {
                status: 'escalated',
                alarmId: rec.alarmId,
                bed: rec.bed,
                to: 'doctor',
              },
              rec,
            );
          }
          break;
        case 'acknowledged':
          if (!inRange) rec.inRangeSince = null;
          else if (rec.inRangeSince === null) rec.inRangeSince = ctx.now;
          else if (ctx.now - rec.inRangeSince >= END_AFTER_IN_RANGE_MS)
            this.alarms.delete(rec.alarmId); // ends silently
          break;
        case 'snoozed':
          if (ctx.now < Date.parse(rec.latest.until)) break;
          if (inRange) {
            this.alarms.delete(rec.alarmId);
          } else {
            rec.raisedAt = ctx.now;
            broadcast(
              {
                status: 'raised',
                alarmId: rec.alarmId,
                bed: rec.bed,
                code: rec.code,
                value: valueOf(frame, rec.code),
              },
              rec,
            );
          }
          break;
        case 'escalated':
          break;
      }
    }
  }

  vitalsStream(bed: BedId) {
    return (tick: number, ctx: MockContext): VitalsFrame => {
      const frame = mockFrame(bed, tick, this.hrOverrides.get(bed));
      this.process(frame, ctx);
      return frame;
    };
  }
}

export function createWardFixtures(ward = new MockWard()) {
  type VitalsStreams = {
    [B in BedId as `/topic/vitals.${B}`]: ReturnType<MockWard['vitalsStream']>;
  };
  const streams = Object.fromEntries(
    ALL_BEDS.map((bed) => [`/topic/vitals.${bed}`, ward.vitalsStream(bed)]),
  ) as VitalsStreams; // fromEntries loses the key type; the mapped type restores it

  return {
    streams,
    replies: {
      // ---------- queries ----------
      '/app/patients.get': ({ bed }) => ward.patients.get(bed) ?? null,

      '/app/vitals.history': ({ bed, minutes }) => {
        const now = Math.floor(Date.now() / 1000);
        const frames: VitalsFrame[] = [];
        for (let t = now - minutes * 60; t < now; t++)
          frames.push(mockFrame(bed, t, ward.hrOverrides.get(bed)));
        return frames;
      },

      '/app/medication.list': ({ bed }) => {
        const patient = ward.patients.get(bed);
        return patient
          ? [...ward.orders.values()].filter((o) => o.patientId === patient.id)
          : [];
      },

      '/app/alarms.active': ({ ward: w }) => ward.activeAlarms(w),

      '/app/vitals.manual': ({ bed }) =>
        [...(ward.readings.get(bed) ?? [])].reverse(), // newest first

      // ---------- commands ----------
      '/app/alarms.ack': ({ alarmId, performedAt }, ctx) => {
        if (!isNurse(ctx.actor))
          return forbidden('Only nurses can acknowledge alarms');
        const rec = ward.alarms.get(alarmId);
        if (!rec) return forbidden(`Alarm ${alarmId} is not active`);
        if (
          rec.latest.status === 'acknowledged' ||
          rec.latest.status === 'snoozed'
        ) {
          return {
            status: 'conflict',
            by: rec.latest.by,
            at:
              rec.latest.status === 'acknowledged'
                ? rec.latest.at
                : performedAt,
          };
        }
        rec.latest = {
          status: 'acknowledged',
          alarmId,
          bed: rec.bed,
          by: ctx.actor,
          at: performedAt,
        };
        ctx.emit(`/topic/alarms.${wardOf(rec.bed)}`, rec.latest);
        return accepted(null);
      },

      '/app/alarms.snooze': ({ alarmId, minutes, performedAt }, ctx) => {
        if (!isNurse(ctx.actor))
          return forbidden('Only nurses can snooze alarms');
        const rec = ward.alarms.get(alarmId);
        if (!rec) return forbidden(`Alarm ${alarmId} is not active`);
        if (rec.latest.status === 'snoozed')
          return { status: 'conflict', by: rec.latest.by, at: performedAt };
        const until = new Date(
          Date.parse(performedAt) + minutes * 60_000,
        ).toISOString();
        rec.latest = {
          status: 'snoozed',
          alarmId,
          bed: rec.bed,
          by: ctx.actor,
          until,
        };
        ctx.emit(`/topic/alarms.${wardOf(rec.bed)}`, rec.latest);
        return accepted({ until });
      },

      '/app/medication.order': (
        { patientId, drug, doseMg, route, performedAt },
        ctx,
      ) => {
        if (!isDoctor(ctx.actor))
          return forbidden('Only doctors can order medication');
        if (!ward.patientById(patientId))
          return forbidden(`Unknown patient ${patientId}`);
        if (!(doseMg > 0)) return forbidden('doseMg must be positive');
        const order = ward.addOrder(
          { patientId, drug, doseMg, route },
          ctx.actor,
          performedAt,
        );
        return accepted({ id: order.id });
      },

      '/app/medication.given': ({ id, performedAt }, ctx) => {
        if (!isNurse(ctx.actor))
          return forbidden('Only nurses can give medication');
        const order = ward.orders.get(id);
        if (!order) return forbidden(`Unknown medication order ${id}`);
        if (order.given)
          return { status: 'conflict', by: order.given.by, at: order.given.at };
        order.status = 'given';
        order.given = { by: ctx.actor, at: performedAt };
        return accepted(null);
      },

      // Lab task 1: 'vitals.record' already exists in the RpcContract; this is its fixture.
      // Try `vital: 'hr'` in the form and watch it fail to compile (ManualVital is 'temp' only).
      '/app/vitals.record': ({ bed, vital, value, performedAt }, ctx) => {
        if (!isNurse(ctx.actor))
          return forbidden('Only nurses can record vitals');
        if (!ward.patients.has(bed)) return forbidden(`Bed ${bed} is empty`);
        if (value < 30 || value > 43) return forbidden('Implausible value');
        // stretch: another nurse recorded this bed less than 60 s ago
        const last = ward.readings.get(bed)?.at(-1);
        if (
          last &&
          last.by !== ctx.actor &&
          ctx.now - Date.parse(last.at) < 60_000
        ) {
          return { status: 'conflict', by: last.by, at: last.at };
        }
        ward.readings.set(bed, [
          ...(ward.readings.get(bed) ?? []),
          { bed, vital, value, by: ctx.actor, at: performedAt },
        ]);
        return accepted(null);
      },

      // ---------- room game ----------
      '/app/monitor.set': ({ bed, hr }) => {
        if (!ward.patients.has(bed)) return forbidden(`Bed ${bed} is empty`);
        if (hr < 20 || hr > 220)
          return forbidden('hr must be between 20 and 220');
        ward.hrOverrides.set(bed, hr);
        return accepted(null);
      },
    },
  } satisfies MockFixtures;
}
