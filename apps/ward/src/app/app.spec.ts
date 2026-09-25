import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthStore } from '@core/auth/auth-store';
import { provideStomp, withMockBroker } from '@core/messaging/provide-stomp';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideStomp({}, withMockBroker()),
      ],
    }).compileComponents();
  });

  it('shows the shell with a connection badge once signed in', async () => {
    await TestBed.inject(AuthStore).join('Ann', 'nurse', 'ward-demo');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.brand')?.textContent).toContain('Ward Monitor');
    expect(el.querySelector('app-connection-badge')?.textContent).toContain(
      'MOCK',
    );
    expect(el.textContent).toContain('Ann · nurse');
  });
});
