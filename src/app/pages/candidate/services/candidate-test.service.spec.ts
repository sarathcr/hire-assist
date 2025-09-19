import { TestBed } from '@angular/core/testing';

import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CandidateTestService } from './candidate-test.service';

describe('CandidateTestService', () => {
  let service: CandidateTestService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClientTesting()],
    });
    service = TestBed.inject(CandidateTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
