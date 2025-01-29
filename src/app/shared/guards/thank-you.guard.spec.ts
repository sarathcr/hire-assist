import { TestBed } from '@angular/core/testing';
import { CanDeactivateFn } from '@angular/router';

import { thankYouGuard } from './thank-you.guard';

describe('thankYouGuard', () => {
  const executeGuard: CanDeactivateFn<unknown> = (...guardParameters) => 
      TestBed.runInInjectionContext(() => thankYouGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
