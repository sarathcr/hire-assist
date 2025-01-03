import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { deviceWarningGuard } from './device-warning.guard';

describe('deviceWarningGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => deviceWarningGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
