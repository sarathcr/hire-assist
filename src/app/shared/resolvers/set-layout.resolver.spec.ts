import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { setLayoutResolver } from './set-layout.resolver';

describe('setLayoutResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => setLayoutResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
