import { TestBed } from '@angular/core/testing';

import { AssessmentWarningService } from './assessment-warning.service';

describe('AssessmentWarningService', () => {
  let service: AssessmentWarningService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssessmentWarningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
