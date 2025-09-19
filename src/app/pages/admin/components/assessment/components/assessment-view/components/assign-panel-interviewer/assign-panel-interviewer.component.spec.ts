import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignPanelInterviewerComponent } from './assign-panel-interviewer.component';

describe('AssignPanelInterviewerComponent', () => {
  let component: AssignPanelInterviewerComponent;
  let fixture: ComponentFixture<AssignPanelInterviewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignPanelInterviewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignPanelInterviewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
