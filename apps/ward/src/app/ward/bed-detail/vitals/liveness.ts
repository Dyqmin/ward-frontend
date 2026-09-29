import { computed, inject, type Signal } from '@angular/core';

import { Clock } from '@core/clock';
import { MessageBus } from '@core/messaging/contract';
import { STALE_AFTER_SEC } from '../../ui/format';

/**
 * 3.3 · How old the newest frame is, and whether it is stale. Call it in an injection context
 * (a field initializer): it injects Clock and MessageBus itself.
 */
export function liveness(lastAt: Signal<number | undefined>): {
  ageSec: Signal<number | null>;
  stale: Signal<boolean>;
} {
  const now = inject(Clock).now;
  const bus = inject(MessageBus);
  const ageSec = computed(() => {
    const at = lastAt();
    return at === undefined
      ? null
      : Math.max(0, Math.round((now() - at) / 1000));
  });
  const stale = computed(
    () => !bus.connected() || (ageSec() ?? 0) > STALE_AFTER_SEC,
  );
  return { ageSec, stale };
}
