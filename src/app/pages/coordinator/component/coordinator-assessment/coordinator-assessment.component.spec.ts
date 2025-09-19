import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoordinatorAssessmentComponent } from './coordinator-assessment.component';

describe('CoordinatorAssessmentComponent', () => {
  let component: CoordinatorAssessmentComponent;
  let fixture: ComponentFixture<CoordinatorAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinatorAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoordinatorAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
