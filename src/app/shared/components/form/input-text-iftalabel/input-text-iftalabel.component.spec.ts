import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CustomFormControlConfig } from '../../../utilities/form.utility';
import { InputTextIftalabelComponent } from './input-text-iftalabel.component';

describe('InputTextIftalabelComponent', () => {
  let component: InputTextIftalabelComponent;
  let fixture: ComponentFixture<InputTextIftalabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputTextIftalabelComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InputTextIftalabelComponent);
    component = fixture.componentInstance;

    component.config = { id: 'testLabel' } as CustomFormControlConfig;
    component.formGroup = new FormGroup({
      testLabel: new FormControl('Inital value'),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize formControl and inputTextConfig on ngOnInit', () => {
    expect(component.formControl).toBeDefined();
    expect(component.inputTextConfig).toBeDefined();
    expect(component.formControl.value).toBe('Inital value');
    expect(component.inputTextConfig.id).toBe('testLabel');
  });

  it('should update formControl value on input change', () => {
    const event = { target: { value: 'new value' } } as unknown as Event;
    component.onInputChange(event);
    expect(component.formControl.value).toBe('new value');
  });

  it('should not display validation error when form control is valid', () => {
    component.formControl.markAsTouched();
    component.formControl.setValue('valid-password');
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(
      By.css('.input-text__validation-label'),
    );
    expect(errorElement).toBeNull();
  });

  it('should display validation error when form control is touched and invalid', () => {
    component.formControl.setErrors({ required: true });
    component.formControl.markAsTouched();
    component.formControl.setErrors({ required: true });
    fixture.detectChanges();
    const errorElement = fixture.debugElement.query(
      By.css('.input-text__validation-label'),
    );
    expect(errorElement).toBeTruthy(); // check if element exists
    expect(errorElement.nativeElement.textContent.trim()).toBe(
      'Field is required',
    );
  });

  it('should display null when labelKey is not provided', () => {
    component.config.labelKey = undefined as unknown as string;
    fixture.detectChanges();
    const labelElement = fixture.debugElement.query(
      By.css('conditional_label'),
    );
    expect(labelElement).toBeNull();
  });

  it('should assign formControl from formGroup using config.id', () => {
    const testControl = new FormControl('initial value');
    component.config = {
      id: 'testInput',
      labelKey: 'Test Input',
    };
    component.formGroup = new FormGroup({
      testInput: testControl,
    });
    component.ngOnInit();
    expect(component.formControl).toBe(testControl as FormControl<string>);
    expect(component.formControl.value).toBe('initial value');
  });
});
