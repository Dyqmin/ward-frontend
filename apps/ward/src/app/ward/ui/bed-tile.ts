import { Component, input } from '@angular/core';

import type { BedId } from '@core/messaging/contract';

// ============================================================================================
//  DAY 2 · LIVE CODING — the bed tile of the nurse station
// ============================================================================================
//  Every step below is commented out. Uncomment (or retype) them in order; after each step the
//  app compiles and /ward shows the result. Each step says which lines to take:
//    ts    – this file (imports at the top, members in the class)
//    html  – bed-tile.html
//    other – another file, named in the step
//  Styles are ready in bed-tile.scss. The finished tile is the same as on main.
// ============================================================================================

// ---- imports, uncommented step by step ----
// STEP 1.1
// import { inject } from '@angular/core';
// import { rxResource } from '@angular/core/rxjs-interop';
// import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
// import { map } from 'rxjs';
// import { MessageBus } from '@core/messaging/contract';
// STEP 1.2
// import { computed } from '@angular/core';
// import { Clock } from '@core/clock';
// STEP 1.3
// import { STALE_AFTER_SEC } from './format';
// STEP 2.1
// import { VitalValue } from './vital-value';
// STEP 2.2
// import type { Patient } from '@core/messaging/contract';
// import type { AlarmView } from '../data/alarms-store';
// import { alarmTitle, isUrgent } from './format';
// STEP 3.1
// import { RouterLink } from '@angular/router';
// import { toSlug } from '@core/messaging/contract';

@Component({
  selector: 'app-bed-tile',
  // STEP 1.1: imports: [NgxSkeletonLoaderComponent],
  // STEP 2.1: imports: [NgxSkeletonLoaderComponent, VitalValue],
  // STEP 3.1: imports: [RouterLink, VitalValue, NgxSkeletonLoaderComponent],
  templateUrl: './bed-tile.html',
  styleUrl: './bed-tile.scss',
})
export class BedTile {
  readonly bed = input.required<BedId>();

  // ------------------------------------------------------------------------------------------
  //  BLOCK 1 · SIGNALS
  // ------------------------------------------------------------------------------------------

  // STEP 1.1 · Live data as a signal
  // Show: a Resource is a set of signals (hasValue, value, error, isLoading). `params` is
  // reactive: a new `bed` restarts the stream by itself, no subscribe / unsubscribe anywhere.
  // Also: the payload type comes from the destination string (Day 1, Step 4) — no <VitalsFrame>.
  // Then in html: STEP 1.1.
  //
  // private readonly bus = inject(MessageBus);
  //
  // readonly vitals = rxResource({
  //   params: () => this.bed(),
  //   stream: ({ params: bed }) =>
  //     this.bus
  //       .watch(`/topic/vitals.${bed}`)
  //       .pipe(map((frame) => ({ frame, at: Date.now() }))),
  // });

  // STEP 1.2 · Derived state: how old is the frame
  // Show: `now` is a signal from a service (one shared 1 Hz clock), `ageSec` is computed from two
  // signals. No timer in the component, no manual change detection (the app is zoneless).
  // Age is measured from ARRIVAL (`at`), so a skewed server clock can't make old data look live.
  // Then in html: STEP 1.2.
  //
  // private readonly now = inject(Clock).now;
  //
  // readonly ageSec = computed(() =>
  //   this.vitals.hasValue()
  //     ? Math.max(0, Math.round((this.now() - this.vitals.value().at) / 1000))
  //     : null,
  // );

  // STEP 1.3 · Derived from derived
  // Show: `stale` reads another computed and a signal from the bus. It recomputes only when one
  // of them changes, and the template only updates when `stale` actually flips.
  // Demo: Dev toolbar → Simulate outage (8 s).
  // Then in html: STEP 1.3.
  //
  // /** Stale data that looks live is the most dangerous thing this screen could do. */
  // readonly stale = computed(
  //   () => !this.bus.connected() || (this.ageSec() ?? 0) > STALE_AFTER_SEC,
  // );

  // ------------------------------------------------------------------------------------------
  //  BLOCK 2 · COMPONENT API
  // ------------------------------------------------------------------------------------------

  // STEP 2.1 · A child component with signal inputs
  // Build VitalValue first: vital-value.ts, STEP 2.1 (and vital-value.html).
  // Then in html: STEP 2.1 replaces the raw numbers from STEP 1.1.

  // STEP 2.2 · Inputs from the parent
  // Show: `patient` has three states in ONE input — undefined (loading), null (empty bed), Patient.
  // `alarms` has a default, so the parent may leave it out. `urgent` is computed from an input.
  // other: nurse-station.html and ward-rounds.html, STEP 2.2 (bind [patient] and [alarms]).
  // Then in html: STEP 2.2.
  //
  // /** `undefined` while loading, `null` for an empty bed. */
  // readonly patient = input<Patient | null | undefined>(undefined);
  // readonly alarms = input<readonly AlarmView[]>([]);
  //
  // protected readonly urgent = computed(() => this.alarms().some(isUrgent));
  // protected readonly alarmTitle = alarmTitle;
  // protected readonly isUrgent = isUrgent;

  // ------------------------------------------------------------------------------------------
  //  BLOCK 3 · COMPONENT ARCHITECTURE
  // ------------------------------------------------------------------------------------------

  // STEP 3.1 · The tile as a link
  // Then in html: STEP 3.1 turns the <div class="tile"> into a link to the bed.
  //
  // protected readonly slug = computed(() => toSlug(this.bed()));

  // STEP 3.2 · Talking points (no code)
  // - What in this tile is smart? It injects MessageBus and Clock and decides "stale" itself.
  //   What is presentational? patient and alarms come from the parent, rendering is local.
  // - Why not let the tile fetch its patient too? The nurse station needs all 18 patients at
  //   once (PatientsStore), and ward rounds reuses the same tile with the same data.
  // - Why not move the vitals up to the nurse station? It would juggle 18 streams and hand frames
  //   down. Here each tile owns one stream, and its lifetime is the tile's: leave the page (or
  //   filter a ward out) and the subscription ends with the tile.
  // - The bed screen (participants' Part 3) makes the other choice: a smart BedVitals container
  //   and a presentational VitalsCard. Compare the two splits.
}
