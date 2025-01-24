import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputTextIftalabelComponent } from './input-text-iftalabel.component';

describe('InputTextIftalabelComponent', () => {
  let component: InputTextIftalabelComponent;
  let fixture: ComponentFixture<InputTextIftalabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputTextIftalabelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputTextIftalabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
