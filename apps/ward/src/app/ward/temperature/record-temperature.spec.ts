// The lab's "Done when" list as tests. Instructions: the LAB roadmap at the top of
// ward/temperature/temperature-form.ts.
//
//   pnpm nx test ward --include='**/record-temperature.spec.ts'
//
// Each describe block is one task; they build on each other, so work top to bottom.
// Filter to one task with  --filter='Task 1'  (or 2, 3, 4).
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  Router,
  provideRouter,
  withComponentInputBinding,
  withNavigationErrorHandler,
  withRouterResources,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, firstValueFrom } from 'rxjs';

import { routes } from '../../app.routes';
import { AuthStore } from '@core/auth/auth-store';
import { MessageBus, type Role } from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { provideStomp, withMockBroker } from '@core/messaging/provide-stomp';
import { handleNavigationError } from '@core/navigation-errors';
import { createWardFixtures, MockWard } from '../../testing/ward-fixtures';

let ward: MockWard;
let bus: FakeMessageBus;

async function setUp(role: Role) {
  sessionStorage.clear();
  vi.useFakeTimers();
  ward = new MockWard();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      // the same provideX() calls as app.config.ts, with the mock ward
      provideRouter(
        routes,
        withComponentInputBinding(),
        withRouterResources(),
        withNavigationErrorHandler(handleNavigationError),
      ),
      provideStomp({}, withMockBroker(createWardFixtures(ward))),
    ],
  });
  await TestBed.inject(AuthStore).join('Ann', role, 'ward-demo');
  bus = TestBed.inject(MessageBus) as FakeMessageBus;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/** A reply, or the broker's error as a value, so a missing fixture reads as a failed expectation. */
async function reply<T>(
  request$: Observable<T>,
): Promise<T | { error: string }> {
  const result = firstValueFrom(request$).catch((e: Error) => ({
    error: e.message,
  }));
  await settle(400);
  return result;
}

/** The temperature input, or a clear failure when the route (Task 2) does not render the form. */
function temperatureInput(page: HTMLElement): HTMLInputElement {
  const input = page.querySelector<HTMLInputElement>('input[name="temp"]');
  if (!input)
    throw new Error(
      `No temperature form at ${TestBed.inject(Router).url}: add the ':bed/temperature' route (Task 2)`,
    );
  return input;
}

/** Every request to the fake broker takes 300 ms, so let the clock run while the router works. */
async function settle(ms = 1_000) {
  await vi.advanceTimersByTimeAsync(ms);
}

const realTimeout = globalThis.setTimeout; // captured before vi.useFakeTimers()

/**
 * Run the fake clock until `done()` holds (or 10 fake seconds pass). Lazy chunks load in real
 * time, so the real event loop gets a turn between fake ticks.
 */
async function until(done: () => boolean) {
  for (let i = 0; i < 100 && !done(); i++) {
    await new Promise((resolve) => realTimeout(resolve, 5));
    await vi.advanceTimersByTimeAsync(100);
  }
}

async function navigated<T>(navigation: Promise<T>): Promise<T> {
  let finished = false;
  void navigation.finally(() => (finished = true));
  await until(() => finished);
  return navigation;
}

describe('Task 1: the vitals.record fixture', () => {
  beforeEach(() => setUp('nurse'));

  const record = (value: number, bed: 'ICU-3' | 'ICU-6' = 'ICU-3') =>
    reply(bus.send('/app/vitals.record', { bed, vital: 'temp', value }));

  it('accepts 37.2 and stores exactly one reading', async () => {
    expect(await record(37.2)).toEqual({ status: 'accepted', value: null });
    expect(ward.readings.get('ICU-3')).toEqual([
      expect.objectContaining({ bed: 'ICU-3', vital: 'temp', value: 37.2 }),
    ]);
  });

  it.each([51, 29.9, 43.1])('refuses %s °C as implausible', async (value) => {
    expect(await record(value)).toEqual({
      status: 'forbidden',
      reason: 'Implausible value',
    });
    expect(ward.readings.get('ICU-3') ?? []).toHaveLength(0);
  });

  it('accepts the edges, 30 and 43 °C', async () => {
    expect(await record(30)).toMatchObject({ status: 'accepted' });
    expect(await record(43)).toMatchObject({ status: 'accepted' });
  });

  it('refuses an empty bed', async () => {
    expect(await record(37, 'ICU-6')).toMatchObject({ status: 'forbidden' });
  });

  it('shows the reading in vitals.manual, the bed detail’s temperature list', async () => {
    await record(37.2);
    const list = await reply(
      bus.request('/app/vitals.manual', { bed: 'ICU-3' }),
    );
    expect(list).toEqual([expect.objectContaining({ value: 37.2 })]);
  });
});

describe('Task 1: the vitals.record fixture, as a doctor', () => {
  beforeEach(() => setUp('doctor'));

  it('refuses the command: roles are checked twice', async () => {
    const result = await reply(
      bus.send('/app/vitals.record', {
        bed: 'ICU-3',
        vital: 'temp',
        value: 37,
      }),
    );
    expect(result).toMatchObject({ status: 'forbidden' });
    expect(ward.readings.get('ICU-3') ?? []).toHaveLength(0);
  });
});

describe('Task 2: the route, as a nurse', () => {
  let harness: RouterTestingHarness;
  const url = () => TestBed.inject(Router).url;
  const page = () => harness.routeNativeElement as HTMLElement;

  beforeEach(async () => {
    await setUp('nurse');
    harness = await RouterTestingHarness.create();
  });

  async function open(path: string) {
    await navigated(harness.navigateByUrl(path));
    harness.detectChanges();
  }

  it('opens /ward/icu-3/temperature with the patient’s name on first paint', async () => {
    await open('/ward/icu-3/temperature');
    expect(url()).toBe('/ward/icu-3/temperature');
    expect(page().querySelector('h1')?.textContent).toContain(
      'Record temperature',
    );
    // blocking resource: the name is there without an @if
    expect(page().textContent).toContain(ward.patients.get('ICU-3')?.name);
  });

  it('sends a bed that does not exist back to /ward (validBed → bedFromSlug → isBedId)', async () => {
    await open('/ward/icu-9/temperature');
    expect(url()).toBe('/ward');
  });

  it('sends an empty bed to /ward?empty=ICU-6, like the bed detail (shared patientResource)', async () => {
    await open('/ward/icu-6/temperature');
    expect(url()).toBe('/ward?empty=ICU-6');
  });

  describe('leaving with a typed but unsent value', () => {
    const type = (value: string) => {
      const input = temperatureInput(page());
      input.value = value;
      input.dispatchEvent(new Event('input'));
      harness.detectChanges();
    };
    const leave = () =>
      navigated(TestBed.inject(Router).navigateByUrl('/ward/icu-3'));

    beforeEach(() => open('/ward/icu-3/temperature'));

    it('asks, and stays when the nurse cancels', async () => {
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      type('37.2');
      await leave();
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(url()).toBe('/ward/icu-3/temperature');
    });

    it('asks, and leaves when the nurse confirms', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      type('37.2');
      await leave();
      expect(url()).toBe('/ward/icu-3');
    });

    it('does not ask when nothing was typed', async () => {
      const confirm = vi.spyOn(window, 'confirm');
      await leave();
      expect(confirm).not.toHaveBeenCalled();
      expect(url()).toBe('/ward/icu-3');
    });
  });
});

describe('Task 2: the route, as a doctor', () => {
  beforeEach(() => setUp('doctor'));

  it('falls through to /forbidden (canMatch, so the form’s chunk is never requested)', async () => {
    const harness = await RouterTestingHarness.create();
    await navigated(harness.navigateByUrl('/ward/icu-3/temperature'));
    expect(TestBed.inject(Router).url).toBe('/forbidden');
  });
});

describe('Saving from the form', () => {
  let harness: RouterTestingHarness;
  const url = () => TestBed.inject(Router).url;
  const page = () => harness.routeNativeElement as HTMLElement;

  beforeEach(async () => {
    await setUp('nurse');
    harness = await RouterTestingHarness.create();
    await navigated(harness.navigateByUrl('/ward/icu-3/temperature'));
    harness.detectChanges();
  });

  /** Type a value and submit the form, as a nurse would. */
  function save(value: string) {
    const input = temperatureInput(page());
    input.value = value;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    page()
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { cancelable: true }));
    harness.detectChanges();
  }

  const attempts = () =>
    bus.log().filter((e) => e.destination === '/app/vitals.record');

  describe('Task 3: the command', () => {
    it('records 37.2 and returns to the bed detail, without asking to discard', async () => {
      const confirm = vi.spyOn(window, 'confirm');
      save('37.2');
      await until(() => url() === '/ward/icu-3');
      expect(ward.readings.get('ICU-3')).toHaveLength(1);
      expect(url()).toBe('/ward/icu-3');
      expect(confirm).not.toHaveBeenCalled();
    });

    it('shows "Implausible value" for 51 and stays on the form', async () => {
      save('51');
      await settle();
      harness.detectChanges();
      expect(page().textContent).toContain('Implausible value');
      expect(url()).toBe('/ward/icu-3/temperature');
      expect(ward.readings.get('ICU-3') ?? []).toHaveLength(0);
    });

    it('sends one command per save', async () => {
      save('37.2');
      await settle();
      expect(attempts()).toHaveLength(1);
      expect(attempts()[0]?.commandId).toBeTruthy();
    });
  });

  describe('Task 4: resilience', () => {
    it('shows "pending sync" while the command is in flight', async () => {
      save('37.2');
      expect(page().textContent).toContain('pending sync');
      await until(() => url() === '/ward/icu-3');
      expect(url()).toBe('/ward/icu-3');
    });

    it('saves through an 8 s outage: several attempts, one commandId, one reading', async () => {
      bus.simulateOutage(8_000);
      save('37.2');
      await settle(4_000);
      harness.detectChanges();
      expect(page().textContent).toContain('pending sync'); // still trying, no error yet
      await settle(4_000); // the broker is back at 8 s
      await until(() => url() === '/ward/icu-3');

      expect(url()).toBe('/ward/icu-3');
      expect(
        attempts().filter((e) => e.outcome === 'offline').length,
      ).toBeGreaterThanOrEqual(2);
      expect(new Set(attempts().map((e) => e.commandId)).size).toBe(1);
      expect(ward.readings.get('ICU-3')).toHaveLength(1);
    });
  });
});
