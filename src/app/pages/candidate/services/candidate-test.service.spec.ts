import { TestBed } from '@angular/core/testing';

import { CandidateTestService } from './candidate-test.service';

describe('CandidateTestService', () => {
  let service: CandidateTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CandidateTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
