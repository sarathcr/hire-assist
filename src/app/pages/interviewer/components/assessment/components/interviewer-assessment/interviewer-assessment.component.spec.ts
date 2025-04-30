import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewerAssessmentComponent } from './interviewer-assessment.component';

describe('InterviewerAssessmentComponent', () => {
  let component: InterviewerAssessmentComponent;
  let fixture: ComponentFixture<InterviewerAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewerAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewerAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
