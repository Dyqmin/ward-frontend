import { Pipe, type PipeTransform } from '@angular/core';

import { calc } from '@perf/perf-stats';
import type { AlarmView } from '../data/alarms-store';
import { chipText } from './format';

/**
 * ✅ GOOD (template-computation): a PURE pipe (the default) runs only when its input changes (`!==`), not on every
 * check. The tool for per-row derived values inside `@for`, where there is no computed() per row.
 */
@Pipe({ name: 'alarmChip' })
export class AlarmChipPipe implements PipeTransform {
  transform(a: AlarmView): string {
    calc('chip text · pipe');
    return chipText(a);
  }
}
