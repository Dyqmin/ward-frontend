import { bedFromSlug } from './contract';
import { link } from './links';
import { ALL_BEDS, isOutOfRange, wardOf } from './ward';

describe('ward helpers', () => {
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

  it('knows the illustrative thresholds', () => {
    expect(isOutOfRange('hr', 131)).toBe(true);
    expect(isOutOfRange('hr', 72)).toBe(false);
    expect(isOutOfRange('spo2', 89)).toBe(true);
  });
});
