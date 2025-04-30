import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentScheduleModalComponent } from './assessment-schedule-modal.component';

describe('AssessmentScheduleModalComponent', () => {
  let component: AssessmentScheduleModalComponent;
  let fixture: ComponentFixture<AssessmentScheduleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentScheduleModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentScheduleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
