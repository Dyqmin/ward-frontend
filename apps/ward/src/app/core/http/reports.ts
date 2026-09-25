import { HttpClient, HttpEventType } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { environment } from '@env';
import { Observable, filter, map } from 'rxjs';

import { AuthStore } from '../auth/auth-store';
import type { BedId } from '../messaging/contract';

export type ReportKind = 'lab' | 'discharge';
export const REPORT_KINDS: readonly ReportKind[] = ['lab', 'discharge'];
export const isReportKind = (v: string): v is ReportKind => (REPORT_KINDS as readonly string[]).includes(v);

export interface DownloadState {
  /** 0…1 */
  progress: number;
  file?: Blob;
}

/**
 * The app's only HTTP feature: PDF reports. ward-worker serves `lab.pdf`; the discharge summary is
 * served by the mock interceptor only (the backend answers 404, which the page explains).
 *
 * `autoProvided: false`: provided on the lazy `reports` route, so it injects THAT route's HttpClient
 * (audit interceptor first, then the root chain via withRequestsMadeViaParent()).
 */
@Service({ autoProvided: false })
export class Reports {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);

  url(kind: ReportKind, bed: BedId, slow = true): string {
    const params = new URLSearchParams();
    if (slow) params.set('slow', '1'); // streamed over ~5 s with a Content-Length, so progress is visible
    const session = this.auth.session();
    if (session?.useSandbox) params.set('room', session.sandboxRoom); // patients differ per room
    const query = params.toString();
    return `${environment.apiUrl}/api/reports/${bed}/${kind}.pdf${query ? `?${query}` : ''}`;
  }

  download(kind: ReportKind, bed: BedId): Observable<DownloadState> {
    return this.http
      .get(this.url(kind, bed), { responseType: 'blob', observe: 'events', reportProgress: true })
      .pipe(
        filter((e) => e.type === HttpEventType.DownloadProgress || e.type === HttpEventType.Response),
        map((e) =>
          e.type === HttpEventType.Response
            ? { progress: 1, file: e.body ?? undefined }
            : { progress: e.total ? e.loaded / e.total : 0 },
        ),
      );
  }
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
