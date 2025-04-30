import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewerCandidateDetailsComponent } from './interviewer-candidate-details.component';

describe('InterviewerCandidateDetailsComponent', () => {
  let component: InterviewerCandidateDetailsComponent;
  let fixture: ComponentFixture<InterviewerCandidateDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewerCandidateDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewerCandidateDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
