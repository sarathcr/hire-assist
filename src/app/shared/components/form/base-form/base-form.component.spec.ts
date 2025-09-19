/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseFormComponent } from './base-form.component';
import { CustomFormControlConfig } from '../../../utilities/form.utility';

class TestFormComponent extends BaseFormComponent {
  formGroup = new FormGroup({
    name: new FormControl('', Validators.required),
  });

  config: CustomFormControlConfig = {
    id: 'name',
    labelKey: 'Name',
    // Add other fields if needed by your actual CustomFormControlConfig
  };
}

describe('BaseFormComponent', () => {
  let component: TestFormComponent;

  beforeEach(() => {
    component = new TestFormComponent();
  });

  it('should return error message when control is invalid and touched', () => {
    const control = component.formGroup.get('name');
    control?.markAsDirty(); // Simulate user touched the field
    control?.setValue(''); // Trigger validation error (required)

    expect(component.errorMsg).toBe('Field is required');
  });

  it('should return custom errorMessage if provided in control errors', () => {
    const control = component.formGroup.get('name');
    control?.setErrors({ errorMessage: 'Custom error here' });

    expect(component.errorMsg).toBe('Custom error here');
  });

  it('should return empty string if control has no error', () => {
    const control = component.formGroup.get('name');
    control?.setValue('valid value');

    expect(component.errorMsg).toBe('');
  });

  it('should return empty string if form control is not found', () => {
    component.config.id = 'nonexistent';

    expect(component.errorMsg).toBe('');
  });
  it('should return empty string if config.id is undefined', () => {
    (component.config as any).id = undefined;

    expect(component.errorMsg).toBe('');
  });
});
