import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewerPanelAssignmentComponent } from './interviewer-panel-assignment.component';

describe('InterviewerPanelAssignmentComponent', () => {
  let component: InterviewerPanelAssignmentComponent;
  let fixture: ComponentFixture<InterviewerPanelAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewerPanelAssignmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewerPanelAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
