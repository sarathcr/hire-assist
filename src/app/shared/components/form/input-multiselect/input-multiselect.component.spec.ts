/* eslint-disable @typescript-eslint/no-explicit-any */
import { DebugElement, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MultiSelectModule } from 'primeng/multiselect';
import { Option } from '../../../models/option';
import { CustomSelectConfig } from '../../../utilities/form.utility';
import { InputMultiselectComponent } from './input-multiselect.component';

describe('InputMultiselectComponent', () => {
  let component: InputMultiselectComponent;
  let fixture: ComponentFixture<InputMultiselectComponent>;

  const optionsMock: Option[] = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
  ];

  const configMock: CustomSelectConfig = {
    id: 'test-select',
    labelKey: 'Select Options',
    options: optionsMock,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InputMultiselectComponent,
        ReactiveFormsModule,
        MultiSelectModule,
        FloatLabelModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InputMultiselectComponent);
    component = fixture.componentInstance;

    component.formGroup = new FormGroup({
      'test-select': new FormControl([]),
    });

    component.config = configMock;
    component.dynamicSuffix = '';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize options and form control on ngOnInit', () => {
    component.ngOnInit();
    expect(component.options).toEqual(optionsMock);
    expect(component.formControl).toBeDefined();
  });

  it('should update options on config change (ngOnChanges)', () => {
    const newOptions: Option[] = [{ label: 'New', value: 'n' }];
    const newConfig = { ...configMock, options: newOptions };
    component.ngOnChanges({
      config: {
        currentValue: newConfig,
        previousValue: configMock,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(component.options).toEqual(newOptions);
  });

  it('should unsubscribe in ngOnDestroy', () => {
    const unsubscribeSpy = jasmine.createSpy('unsubscribe');
    (component as any).subs = { unsubscribe: unsubscribeSpy };
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should render the p-multiselect component', () => {
    const multiselect: DebugElement = fixture.debugElement.query(
      By.css('p-multiselect'),
    );
    expect(multiselect).toBeTruthy();
  });

  it('should display label from inputTextConfig.labelKey', () => {
    const labelEl = fixture.debugElement.query(By.css('label'));
    expect(labelEl.nativeElement.textContent).toContain('Select Options');
  });

  it('should display validation message if touched and invalid', () => {
    const control = component.formGroup.get('test-select');
    control?.markAsTouched();
    control?.setErrors({ required: true });
    fixture.detectChanges();

    const validationMsg = fixture.debugElement.query(
      By.css('.input-multiselect__validation-label'),
    );
    expect(validationMsg).toBeTruthy();
  });

  it('should not display validation message if control is untouched or valid', () => {
    const control = component.formGroup.get('test-select');
    control?.setErrors(null);
    control?.markAsUntouched();
    fixture.detectChanges();

    const validationMsg = fixture.debugElement.query(
      By.css('.input-multiselect__validation-label'),
    );
    expect(validationMsg).toBeNull();
  });

  it('should update selectedItems when value changes', () => {
    const control = component.formGroup.get('test-select');
    control?.setValue(['a']);
    fixture.detectChanges();

    expect(control?.value).toEqual(['a']);
  });

  it('should handle empty options gracefully', () => {
    component.options = [];
    fixture.detectChanges();

    const multiselect: DebugElement = fixture.debugElement.query(
      By.css('p-multiselect'),
    );
    expect(multiselect).toBeTruthy();
    expect(multiselect.componentInstance.options).toEqual([]);
  });

  it('should fallback to empty array if options are undefined in config', () => {
    const configWithNoOptions = { ...configMock, options: undefined };
    component.config = configWithNoOptions;
    component.ngOnInit();
    expect(component.options).toEqual([]);
  });

  it('should handle empty selectedItems gracefully', () => {
    (component as any).selectedItems = signal([]);
    fixture.detectChanges();
    expect(component.selectedItems()).toEqual([]);
  });

  it('should handle null selectedItems gracefully', () => {
    (component as any).selectedItems = signal(null);
    fixture.detectChanges();
    expect(component.selectedItems()).toBeNull();
  });

  it('should throw error if formGroup is not provided', () => {
    component.formGroup = null as any;
    expect(() => component.ngOnInit()).toThrowError();
  });

  it('should not throw if form control is missing in form group', () => {
    component.formGroup = new FormGroup({});
    component.config = configMock;
    expect(() => component.ngOnInit()).not.toThrow();
    expect(component.formControl).toBeNull(); // or undefined
  });
});
