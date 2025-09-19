import { TestBed } from '@angular/core/testing';

import { InterviewerAssessmentService } from './interviewer-assessment.service';

describe('InterviewerAssessmentService', () => {
  let service: InterviewerAssessmentService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
    });
    service = TestBed.inject(InterviewerAssessmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
