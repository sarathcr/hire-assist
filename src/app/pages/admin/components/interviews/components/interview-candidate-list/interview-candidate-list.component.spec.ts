import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewCandidateListComponent } from './interview-candidate-list.component';

describe('InterviewCandidateListComponent', () => {
  let component: InterviewCandidateListComponent;
  let fixture: ComponentFixture<InterviewCandidateListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewCandidateListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewCandidateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
