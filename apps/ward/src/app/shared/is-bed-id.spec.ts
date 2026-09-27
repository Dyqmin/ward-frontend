import { bedFromSlug, isBedId } from './contract';

describe('Exercise 2: isBedId', () => {
  it.each(['ICU-1', 'ICU-3', 'ER-6', 'CARD-1', 'CARD-6'])('accepts %s', (v) => {
    expect(isBedId(v)).toBe(true);
  });

  it.each([
    ['icu-3', 'lower case'],
    ['ICU-9', 'no bed 9'],
    ['ICU-0', 'no bed 0'],
    ['OR-1', 'no such ward'],
    ['ICU-03', 'leading zero'],
    ['ICU-', 'missing number'],
    ['-3', 'missing ward'],
    ['ICU3', 'missing dash'],
    ['', 'empty string'],
    ['ICU-3-1', 'extra part'],
    ['ICU-3 ', 'trailing space'],
  ])('rejects %j (%s)', (v) => {
    expect(isBedId(v)).toBe(false);
  });

  it('powers bedFromSlug, the guard at the URL boundary', () => {
    expect(bedFromSlug('icu-3')).toBe('ICU-3');
    expect(bedFromSlug('icu-9')).toBeNull();
    expect(bedFromSlug('icu-3-1')).toBeNull();
  });
});
