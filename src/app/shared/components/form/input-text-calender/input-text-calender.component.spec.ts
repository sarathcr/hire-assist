/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CalendarModule } from 'primeng/calendar';
import { FloatLabel } from 'primeng/floatlabel';
import { CustomInputTextCalenderConfig } from '../../../utilities/form.utility';
import { InputTextCalenderComponent } from './input-text-calender.component';

describe('InputTextCalenderComponent', () => {
  let component: InputTextCalenderComponent;
  let fixture: ComponentFixture<InputTextCalenderComponent>;

  const configMock: CustomInputTextCalenderConfig = {
    id: 'calendar-date',
    labelKey: 'Select Date',
    matPrefix: 'From',
    matSuffix: 'To',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FloatLabel, FormsModule, CalendarModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InputTextCalenderComponent);
    component = fixture.componentInstance;
    component.formGroup = new FormGroup({
      'calendar-date': new FormControl(''),
    });

    component.config = configMock;
    component.dynamicSuffix = 'Dynamic';
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize config and formControl', () => {
    component.ngOnInit();
    expect(component.inputTextCalendarConfig).toEqual(configMock);
    expect(component.formControl).toBeDefined();
  });

  // it('should update formControl value on input event', () => {
  //   component.ngOnInit();
  //   fixture.detectChanges();
  //
  //   const input = document.createElement('input');
  //   input.value = '12-05-2024';
  //
  //   const event = new Event('input');
  //   Object.defineProperty(event, 'target', { value: input });
  //
  //   component.onInputChange(event);
  //   expect(component.formControl.value).toBe('12-05-2024');
  // });

  it('should display label from config.labelKey', () => {
    component.ngOnInit();
    fixture.detectChanges();

    const label = fixture.debugElement.query(By.css('label')).nativeElement;
    expect(label.textContent).toContain('Select Date');
  });

  it('should throw error if formGroup is null', () => {
    component.formGroup = null as any;
    expect(() => component.ngOnInit()).toThrow();
  });

  it('should display error message if control is touched and invalid', () => {
    component.ngOnInit();
    component.formControl.setErrors({ required: true });
    component.formControl.markAsTouched();
    fixture.detectChanges();

    const error = fixture.debugElement.query(
      By.css('.input-text-calender__validation-label'),
    );
    expect(error).toBeTruthy();
  });

  it('should not display error message if control is valid', () => {
    component.ngOnInit();
    component.formControl.setErrors(null);
    component.formControl.markAsUntouched();
    fixture.detectChanges();

    const error = fixture.debugElement.query(
      By.css('.input-text-calender__validation-label'),
    );
    expect(error).toBeNull();
  });

  it('should display dynamicSuffix if others are missing', () => {
    component.config = {
      ...configMock,
      matSuffix: undefined,
      matPrefix: undefined,
    };
    component.dynamicSuffix = 'FallbackSuffix';
    component.ngOnInit();
    fixture.detectChanges();

    const suffix = fixture.debugElement.query(
      By.css('.input-suffix'),
    ).nativeElement;
    expect(suffix.textContent).toContain('FallbackSuffix');
  });

  it('should reflect value set programmatically in FormControl', () => {
    component.ngOnInit();
    component.formControl.setValue('01-01-2024');
    fixture.detectChanges();

    const nativeInput: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    expect(nativeInput.value).toContain('01-01-2024');
  });

  // it('should handle empty input string gracefully', () => {
  //   component.ngOnInit();
  //
  //   const event = new Event('input');
  //   Object.defineProperty(event, 'target', {
  //     value: { value: '' },
  //   });
  //
  //   component.onInputChange(event);
  //   expect(component.formControl.value).toBe('');
  // });

  it('should handle missing optional config fields without throwing', () => {
    component.config = {
      id: 'calendar-date',
      labelKey: undefined!,
      matPrefix: undefined!,
      matSuffix: undefined!,
    };
    component.formGroup = new FormGroup({
      'calendar-date': new FormControl(''),
    });

    expect(() => component.ngOnInit()).not.toThrow();
  });
});
