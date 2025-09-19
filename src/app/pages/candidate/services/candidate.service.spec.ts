import { TestBed } from '@angular/core/testing';

import { CandidateService } from './candidate.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CandidateService', () => {
  let service: CandidateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClientTesting()],
    });
    service = TestBed.inject(CandidateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
