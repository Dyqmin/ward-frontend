import { FRAME_GUARDS, FrameError, parseFrame, streamNameOf } from './frames';

describe('frames', () => {
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
});
