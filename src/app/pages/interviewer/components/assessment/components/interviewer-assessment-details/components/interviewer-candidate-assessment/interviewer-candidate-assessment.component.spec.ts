import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewerCandidateAssessmentComponent } from './interviewer-candidate-assessment.component';

describe('InterviewerCandidateAssessmentComponent', () => {
  let component: InterviewerCandidateAssessmentComponent;
  let fixture: ComponentFixture<InterviewerCandidateAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewerCandidateAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewerCandidateAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
