import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputTextCalenderComponent } from './input-text-calender.component';

describe('InputTextCalenderComponent', () => {
  let component: InputTextCalenderComponent;
  let fixture: ComponentFixture<InputTextCalenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputTextCalenderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputTextCalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
