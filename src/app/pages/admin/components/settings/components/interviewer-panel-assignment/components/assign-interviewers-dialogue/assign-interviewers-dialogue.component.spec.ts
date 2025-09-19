import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignInterviewersDialogueComponent } from './assign-interviewers-dialogue.component';

describe('AssignInterviewersDialogueComponent', () => {
  let component: AssignInterviewersDialogueComponent;
  let fixture: ComponentFixture<AssignInterviewersDialogueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignInterviewersDialogueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignInterviewersDialogueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
