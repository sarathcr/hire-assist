import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionFormModalComponent } from './question-form-modal.component';

describe('QuestionFormModalComponent', () => {
  let component: QuestionFormModalComponent;
  let fixture: ComponentFixture<QuestionFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionFormModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
