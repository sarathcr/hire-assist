import { TestBed } from '@angular/core/testing';
import { AssessmentScheduleService } from './assessment-schedule.service';

describe('AssessmentScheduleService', () => {
  let service: AssessmentScheduleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssessmentScheduleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
