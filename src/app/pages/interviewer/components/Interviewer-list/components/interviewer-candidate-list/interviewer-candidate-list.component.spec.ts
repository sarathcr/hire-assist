import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewerCandidateListComponent } from './interviewer-candidate-list.component';

describe('InterviewerCandidateListComponent', () => {
  let component: InterviewerCandidateListComponent;
  let fixture: ComponentFixture<InterviewerCandidateListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewerCandidateListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewerCandidateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
