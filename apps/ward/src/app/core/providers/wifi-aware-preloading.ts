import { Service } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Preload what every user needs (routes with `data: { preload: true }`), never the phone
 * simulator — and nothing at all on a slow or metered connection.
 */
@Service()
export class WifiAwarePreloading implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    const slow = conn?.saveData === true || /2g/.test(conn?.effectiveType ?? '');
    return route.data?.['preload'] && !slow ? load() : of(null);
  }
}
