import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentCardComponent } from './assessment-card.component';

describe('AssessmentCardComponent', () => {
  let component: AssessmentCardComponent;
  let fixture: ComponentFixture<AssessmentCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
