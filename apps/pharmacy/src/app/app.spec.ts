import { TestBed } from '@angular/core/testing';

import { App } from './app';

describe('App', () => {
  it('lists the orders still to prepare', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Pharmacy desk');
    expect(el.querySelectorAll('.order')).toHaveLength(3);
  });
});
