import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewerAssessmentDetailsComponent } from './interviewer-assessment-details.component';

describe('InterviewerAssessmenDetailsComponent', () => {
  let component: InterviewerAssessmentDetailsComponent;
  let fixture: ComponentFixture<InterviewerAssessmentDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewerAssessmentDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InterviewerAssessmentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
