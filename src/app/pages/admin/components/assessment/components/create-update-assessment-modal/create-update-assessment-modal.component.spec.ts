import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateUpdateAssessmentModalComponent } from './create-update-assessment-modal.component';

describe('CreateUpdateAssessmentModalComponent', () => {
  let component: CreateUpdateAssessmentModalComponent;
  let fixture: ComponentFixture<CreateUpdateAssessmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateUpdateAssessmentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateUpdateAssessmentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
