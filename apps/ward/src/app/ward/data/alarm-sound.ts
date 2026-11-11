import { Service, type Signal } from '@angular/core';

import { gauge } from '@perf/perf-stats';

/** What the sound needs from an alarm row. */
export interface SoundSource {
  urgent: Signal<boolean>;
}

/**
 * Beeps while any registered alarm row is urgent (muted in the workshop: it only counts).
 * A root service lives as long as the app — whatever it holds, lives that long too.
 */
@Service()
export class AlarmSound {
  private readonly sources = new Set<SoundSource>();

  constructor() {
    gauge('AlarmSound rows', () => this.sources.size);
    gauge(
      'AlarmSound beeping for',
      () => [...this.sources].filter((s) => s.urgent()).length,
    );
  }

  register(source: SoundSource): void {
    this.sources.add(source);
  }

  unregister(source: SoundSource): void {
    this.sources.delete(source);
  }
}
