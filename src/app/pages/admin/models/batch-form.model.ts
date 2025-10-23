import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class BatchForm extends FormEntity {
  title = '';
  description = '';
  isActive = false;

  metadata: Metadata = {
    validatorsMap: {
      title: [
        Validators.required,
        Validators.pattern('^[A-Za-z].*'),
        Validators.minLength(3),
        Validators.maxLength(25),
        BatchForm.noExtraSpacesValidator,
      ],
      description: [Validators.maxLength(150)],
    },
    configMap: {
      title: { id: 'title', labelKey: 'Title' },
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
