import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class AssessmentForm extends FormEntity {
  name = '';
  description = '';
  statusId = 0;
  panel = 0;
  startDateTime = '';
  endDateTime = '';
  isActive = false;
  createdAt = '';

  metadata: Metadata = {
    validatorsMap: {
      statusId: [Validators.required],
      name: [
        Validators.required,
        Validators.pattern('^[A-Za-z].*'),
        Validators.minLength(3),
        Validators.maxLength(25),
        AssessmentForm.noExtraSpacesValidator,
      ],
      description: [Validators.maxLength(150)],
      startDateTime: [Validators.required],
      endDateTime: [Validators.required],
    },
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      description: { id: 'description', labelKey: 'Description' },
      statusId: { id: 'statusId', labelKey: 'Status' },
      panel: { id: 'panel', labelKey: 'Panel' },
      startDateTime: { id: 'startDateTime', labelKey: 'Start Date' },
      endDateTime: { id: 'endDateTime', labelKey: 'End Date' },
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
