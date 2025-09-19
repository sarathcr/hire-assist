import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontdeskAssessmentRoundsComponent } from './frontdesk-assessment-rounds.component';

describe('FrontdeskAssessmentRoundsComponent', () => {
  let component: FrontdeskAssessmentRoundsComponent;
  let fixture: ComponentFixture<FrontdeskAssessmentRoundsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontdeskAssessmentRoundsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontdeskAssessmentRoundsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
