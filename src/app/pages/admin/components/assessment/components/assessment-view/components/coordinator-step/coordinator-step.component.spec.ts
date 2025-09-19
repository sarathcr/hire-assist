import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoordinatorStepComponent } from './coordinator-step.component';

describe('CoordinatorStepComponent', () => {
  let component: CoordinatorStepComponent;
  let fixture: ComponentFixture<CoordinatorStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinatorStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoordinatorStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
