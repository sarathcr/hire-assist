import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewerAsssessmentListComponent } from './interviewer-asssessment-list.component';

describe('InterviewerAsssessmentListComponent', () => {
  let component: InterviewerAsssessmentListComponent;
  let fixture: ComponentFixture<InterviewerAsssessmentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewerAsssessmentListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewerAsssessmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
