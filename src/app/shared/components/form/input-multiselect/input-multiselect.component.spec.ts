import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputMultiselectComponent } from './input-multiselect.component';

describe('InputMultiselectComponent', () => {
  let component: InputMultiselectComponent;
  let fixture: ComponentFixture<InputMultiselectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputMultiselectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputMultiselectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
