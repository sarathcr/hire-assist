import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToggleSwitchComponent } from './toggle-switch.component';
import {
  FormGroup,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToggleSwitch } from 'primeng/toggleswitch';

export interface CustomFormControlConfig {
  id: string;
  labelKey: string;
}

export interface CustomToggleSwitchConfig extends CustomFormControlConfig {
  matPrefix?: string;
  matSuffix?: string;
}

describe('ToggleSwitchComponent', () => {
  let component: ToggleSwitchComponent;
  let fixture: ComponentFixture<ToggleSwitchComponent>;

  const mockToggleSwitchConfig: CustomToggleSwitchConfig = {
    id: 'testToggle',
    labelKey: 'Toggle Label',
  };

  const mockFormGroup = new FormGroup({
    testToggle: new FormControl(null),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ToggleSwitchComponent,
        FormsModule,
        ReactiveFormsModule,
        ToggleSwitch,
        FloatLabelModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleSwitchComponent);
    component = fixture.componentInstance;

    component.config = mockToggleSwitchConfig;
    component.formGroup = mockFormGroup;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set default value to false if formControl value is null', () => {
    const control = new FormControl(null);
    component.formGroup = new FormGroup({ testToggle: control });
    component.config = mockToggleSwitchConfig;

    component.ngOnInit();

    expect(control.value).toBeFalse();
  });

  it('should display the label from the config', () => {
    const label = fixture.nativeElement.querySelector('label');
    expect(label.textContent).toContain('Toggle Label');
  });

  it('should throw an error if the form control is missing in the form group', () => {
    component.formGroup = new FormGroup({});
    component.config = { id: 'missingControl', labelKey: 'Missing Label' };
    expect(() => component.ngOnInit()).toThrowError(TypeError);
  });

  it('should show validation message when control is touched and invalid', () => {
    const control = component.formGroup.get('testToggle');
    control?.setErrors({ required: true });
    control?.markAsTouched();
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector(
      '.toggle-switch__validation-label',
    );
    expect(error).toBeTruthy();
  });

  it('should update formControl value on input change', () => {
    const mockEvent = { target: { value: 'true' } } as unknown as Event;
    component.onInputChange(mockEvent);
    expect(component.formControl.value).toBe('true');
  });

  it('should not set default value if already true', () => {
    const ctrl = new FormControl(true);
    component.formGroup = new FormGroup({
      testToggle: ctrl,
    });
    component.config = mockToggleSwitchConfig;
    fixture.detectChanges();

    component.ngOnInit();
    expect(ctrl.value).toBeTrue();
  });

  it('should show matSuffix if defined', () => {
    component.customToggleSwitchConfig.matSuffix = 'CustomSuffix';
    component.customToggleSwitchConfig.matPrefix = undefined;
    fixture.detectChanges();

    const suffix = fixture.nativeElement.querySelector('.input-suffix');
    expect(suffix.textContent).toContain('CustomSuffix');
  });

  it('should show matPrefix if matPrefix is  defined', () => {
    component.customToggleSwitchConfig.matPrefix = 'PrefixOnly';
    component.customToggleSwitchConfig.matSuffix = undefined;
    fixture.detectChanges();

    const suffix = fixture.nativeElement.querySelector('.input-prefix');
    expect(suffix.textContent).toContain('PrefixOnly');
  });

  it('should show dynamicSuffix if neither matPrefix nor matSuffix is defined', () => {
    component.customToggleSwitchConfig.matPrefix = undefined;
    component.customToggleSwitchConfig.matSuffix = undefined;
    component.dynamicSuffix = 'DynamicText';
    fixture.detectChanges();

    const suffix = fixture.nativeElement.querySelector('.input-dynamicSuffix');
    expect(suffix.textContent).toContain('DynamicText');
  });
});
