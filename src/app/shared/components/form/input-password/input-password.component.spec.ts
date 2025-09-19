import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CustomFormControlConfig } from '../../../utilities/form.utility';
import { InputPasswordComponent } from './input-password.component';

describe('InputPasswordComponent', () => {
  let component: InputPasswordComponent;
  let fixture: ComponentFixture<InputPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputPasswordComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InputPasswordComponent);
    component = fixture.componentInstance;
    component.config = {
      id: 'testLabel',
      labelKey: 'password',
    } as CustomFormControlConfig;
    component.formGroup = new FormGroup({
      testLabel: new FormControl('Inital value'),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize inputTextConfig and formControl', () => {
    expect(component.inputTextConfig).toBeTruthy();
    expect(component.formControl).toBeTruthy();
    expect(component.inputTextConfig.id).toBe('testLabel');
  });
  it('should update formControl value on input change', () => {
    const event = { target: { value: 'newPassword' } } as unknown as Event;
    component.onInputChange(event);
    expect(component.formControl.value).toBe('newPassword');
  });
  it('should initialize formControl and inputTextConfig on ngOnInit', () => {
    component.ngOnInit();
    expect(component.formControl).toBeDefined();
    expect(component.inputTextConfig).toBeDefined();
    expect(component.formControl.value).toBe('Inital value');
    expect(component.inputTextConfig.id).toBe('testLabel');
  });
  it('should render the password input with correct label', () => {
    const labelElement = fixture.debugElement.query(
      By.css('label'),
    ).nativeElement;
    expect(labelElement.textContent).toContain(component.config.labelKey);
  });

  it('should not display validation error when form control is valid', () => {
    component.formControl.markAsTouched();
    component.formControl.setValue('valid-password');
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(
      By.css('.input-password__validation-label'),
    );
    expect(errorElement).toBeNull();
  });
  it('should display validation error when form control is touched and invalid', () => {
    // Mock errorMsg getter
    Object.defineProperty(component, 'errorMsg', {
      get: () => 'Password is required',
    });
    component.formControl.markAsTouched();
    component.formControl.setErrors({ required: true });
    fixture.detectChanges();
    const errorElement = fixture.debugElement.query(
      By.css('.input-password__validation-label'),
    );
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent).toContain(
      'Password is required',
    );
  });
  it('should set toggleMask to true on p-password', () => {
    const passwordComponent = fixture.debugElement.query(By.css('p-password'));

    expect(passwordComponent.attributes['ng-reflect-toggle-mask']).toBe('true');
  });
  it('should display null when labelKey is not provided', () => {
    component.config.labelKey = undefined as unknown as string;
    fixture.detectChanges();
    const labelElement = fixture.debugElement.query(By.css('over_label'));
    expect(labelElement).toBeNull();
  });
});
