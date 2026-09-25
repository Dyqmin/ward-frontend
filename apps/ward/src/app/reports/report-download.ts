import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';

import { Reports, isReportKind, saveBlob } from '@core/http/reports';
import { bedFromSlug } from '@core/messaging/contract';

@Component({
  selector: 'app-report-download',
  imports: [RouterLink],
  template: `
    <section class="page narrow">
      <a class="back" [routerLink]="['/ward', bed()]">← {{ bedId() }}</a>
      <h1>{{ label() }} · {{ bedId() }}</h1>
      <p class="muted">
        A fictional PDF, streamed in chunks so the download progress is visible.
      </p>

      <div class="card stack">
        <progress [value]="progress()" max="1"></progress>
        <div class="row">
          <span>{{ percent() }} %</span>
          <span class="spacer"></span>
          @if (busy()) {
            <button type="button" (click)="cancel()">Cancel</button>
          } @else {
            <button type="button" class="primary" (click)="download()">
              Download PDF
            </button>
          }
        </div>
        @if (error(); as e) {
          <p class="error-text">{{ e }}</p>
        }
      </div>
    </section>
  `,
  styles: `
    .narrow {
      max-width: 36rem;
    }
    .back {
      text-decoration: none;
    }
    .stack {
      display: grid;
      gap: 0.75rem;
    }
    progress {
      width: 100%;
      height: 0.8rem;
      accent-color: var(--accent);
    }
  `,
})
export default class ReportDownload {
  readonly kind = input.required<string>();
  readonly bed = input.required<string>();

  private readonly reports = inject(Reports); // from the reports route injector
  private sub: Subscription | null = null;

  protected readonly bedId = computed(
    () => bedFromSlug(this.bed()) ?? this.bed(),
  );
  protected readonly label = computed(() =>
    this.kind() === 'lab' ? 'Lab report' : 'Discharge summary',
  );
  protected readonly progress = signal(0);
  protected readonly percent = computed(() =>
    Math.round(this.progress() * 100),
  );
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected download(): void {
    const bed = bedFromSlug(this.bed());
    const kind = this.kind();
    if (!bed || !isReportKind(kind)) return;
    this.busy.set(true);
    this.error.set(null);
    this.progress.set(0);
    this.sub = this.reports
      .download(kind, bed)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (s) => {
          this.progress.set(s.progress);
          if (s.file) saveBlob(s.file, `${kind}-${bed}.pdf`);
        },
        error: (e: unknown) => this.error.set(describe(e)),
      });
  }

  protected cancel(): void {
    this.sub?.unsubscribe();
    this.busy.set(false);
  }
}

function describe(e: unknown): string {
  if (!(e instanceof HttpErrorResponse)) return String(e);
  switch (e.status) {
    case 0:
      return 'Backend unreachable.';
    case 401:
      return 'Session expired — please sign in again.';
    case 403:
      return 'This report belongs to another room.';
    case 404:
      return 'No report: the bed is empty, or this backend does not serve this report type.';
    default:
      return `${e.status} ${e.statusText}`;
  }
}
