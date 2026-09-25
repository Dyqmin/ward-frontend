import {
  FRAME_GUARDS,
  FrameError,
  bedFromSlug,
  isOutOfRange,
  link,
  parseFrame,
  streamNameOf,
  wardOf,
  ALL_BEDS,
} from './contract';

describe('contract (Day 1 layer)', () => {
  it('lists 18 beds across three wards', () => {
    expect(ALL_BEDS).toHaveLength(18);
    expect(wardOf('CARD-2')).toBe('CARD');
  });

  it('turns route slugs into bed ids, and rejects unknown beds', () => {
    expect(bedFromSlug('icu-3')).toBe('ICU-3');
    expect(bedFromSlug('icu-9')).toBeNull();
  });

  it('builds links from typed params', () => {
    expect(
      link('ward/:bed/meds/new/:step', { bed: 'icu-3', step: 'drug' }),
    ).toBe('ward/icu-3/meds/new/drug');
    expect(link('ward')).toBe('ward');
    // @ts-expect-error – a missing param does not compile
    link('ward/:bed', {});
  });

  it('takes the stream name out of a destination', () => {
    expect(streamNameOf('/topic/vitals.ICU-3')).toBe('vitals');
    expect(streamNameOf('/topic/alarms.ER')).toBe('alarms');
  });

  it('parses frames through their guard', () => {
    const frame = parseFrame(
      '{"bed":"ICU-3","ts":1,"hr":72,"spo2":97,"rr":14}',
      FRAME_GUARDS.vitals,
    );
    expect(frame.hr).toBe(72);
    expect(() =>
      parseFrame('{"bed":"ICU-9","ts":1}', FRAME_GUARDS.vitals),
    ).toThrow(FrameError);
    expect(() => parseFrame('not json', FRAME_GUARDS.alarms)).toThrow(
      FrameError,
    );
  });

  it('knows the illustrative thresholds', () => {
    expect(isOutOfRange('hr', 131)).toBe(true);
    expect(isOutOfRange('hr', 72)).toBe(false);
    expect(isOutOfRange('spo2', 89)).toBe(true);
  });
});
