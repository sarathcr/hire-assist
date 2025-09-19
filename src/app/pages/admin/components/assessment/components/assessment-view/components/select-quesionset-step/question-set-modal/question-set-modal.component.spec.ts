import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionSetModalComponent } from './question-set-modal.component';

describe('QuestionSetModalComponent', () => {
  let component: QuestionSetModalComponent;
  let fixture: ComponentFixture<QuestionSetModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionSetModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionSetModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
