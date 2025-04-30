import { TestBed } from '@angular/core/testing';

import { InterviewerAssessmentService } from './interviewer-assessment.service';

describe('InterviewerAssessmentService', () => {
  let service: InterviewerAssessmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterviewerAssessmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
