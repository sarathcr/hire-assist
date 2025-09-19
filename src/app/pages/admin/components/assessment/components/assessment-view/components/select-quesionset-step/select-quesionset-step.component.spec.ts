import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectQuesionsetStepComponent } from './select-quesionset-step.component';

describe('SelectQuesionsetStepComponent', () => {
  let component: SelectQuesionsetStepComponent;
  let fixture: ComponentFixture<SelectQuesionsetStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectQuesionsetStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectQuesionsetStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
