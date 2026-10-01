import {
  BED_NUMBERS,
  type BedId,
  type BedSlug,
  type StreamedVital,
  type Ward,
  WARDS,
} from './contract';

export const ALL_BEDS: readonly BedId[] = WARDS.flatMap((w) =>
  BED_NUMBERS.map((n): BedId => `${w}-${n}`),
);

export const wardOf = (bed: BedId): Ward => bed.split('-')[0] as Ward;
export const bedsOf = (ward: Ward): readonly BedId[] =>
  ALL_BEDS.filter((b) => wardOf(b) === ward);
export const toSlug = (bed: BedId): BedSlug => bed.toLowerCase() as BedSlug;

/** Illustrative thresholds, the same the server uses to raise alarms. Not clinical. */
export const THRESHOLDS: Record<
  StreamedVital,
  { low?: number; high?: number }
> = {
  hr: { low: 45, high: 130 },
  spo2: { low: 90 },
  rr: { low: 8, high: 28 },
};
export const isOutOfRange = (vital: StreamedVital, value: number): boolean => {
  const t = THRESHOLDS[vital];
  return (
    (t.low !== undefined && value < t.low) ||
    (t.high !== undefined && value > t.high)
  );
};
