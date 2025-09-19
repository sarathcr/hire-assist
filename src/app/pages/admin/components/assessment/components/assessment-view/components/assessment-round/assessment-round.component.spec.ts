import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentRoundComponent } from './assessment-round.component';

describe('AssessmentRoundComponent', () => {
  let component: AssessmentRoundComponent;
  let fixture: ComponentFixture<AssessmentRoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentRoundComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentRoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
