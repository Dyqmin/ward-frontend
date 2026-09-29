import { provideHttpClient } from '@angular/common/http';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';

import { AuthStore } from '@core/auth/auth-store';
import { MessageBus } from '@core/messaging/contract';
import { FakeMessageBus } from '@core/messaging/fake-message-bus';
import { provideStomp, withMockBroker } from '@core/messaging/provide-stomp';

/** Shared by the Day 3 specs: the in-memory ward (one frame per second) with a fake clock. */
export async function withMockWard(): Promise<FakeMessageBus> {
  sessionStorage.clear();
  vi.useFakeTimers();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideStomp({}, withMockBroker())],
  });
  await TestBed.inject(AuthStore).join('Ann', 'nurse', 'ward-demo');
  return TestBed.inject(MessageBus) as FakeMessageBus;
}

export async function advance(
  fixture: ComponentFixture<unknown>,
  ms: number,
): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  fixture.detectChanges();
  await fixture.whenStable();
}

export const text = (e: Element | null | undefined): string =>
  e?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
