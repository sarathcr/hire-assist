import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentFormModal } from './assessment-form-modal.component';

describe('CreateComponent', () => {
  let component: AssessmentFormModal;
  let fixture: ComponentFixture<AssessmentFormModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentFormModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
