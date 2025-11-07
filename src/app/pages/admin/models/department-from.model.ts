import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class DepartmentForm extends FormEntity {
  name = '';
  description = '';
  isActive = false;

  metadata: Metadata = {
    validatorsMap: {
      name: [
        Validators.required,
        Validators.maxLength(150),
        Validators.minLength(2),
        Validators.pattern('^[A-Za-z].*'),
        DepartmentForm.noExtraSpacesValidator,
      ],
      description: [Validators.maxLength(500)],
    },
    configMap: {
      name: {
        id: 'name',
        labelKey: 'Name',
      },
      description: { id: 'description', labelKey: 'Description' },
      isActive: { id: 'isActive', labelKey: 'Active' },
    },
  };
  private static noExtraSpacesValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;

    if (/\s{2,}/.test(value)) {
      return { extraSpaces: true };
    }
    return null;
  }
}
