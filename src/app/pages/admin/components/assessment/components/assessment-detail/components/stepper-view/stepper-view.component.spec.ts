import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepperViewComponent } from './stepper-view.component';

describe('StepperViewComponent', () => {
  let component: StepperViewComponent;
  let fixture: ComponentFixture<StepperViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepperViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepperViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
