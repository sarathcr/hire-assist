import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class QuestionTypeForm extends FormEntity {
  questionType = '';

  metadata: Metadata = {
    validatorsMap: {
      questionType: [
        Validators.required,
        Validators.pattern('^[A-Za-z].*'),
        Validators.minLength(2),
        Validators.maxLength(50),
        QuestionTypeForm.noExtraSpacesValidator,
      ],
    },
    configMap: {
      questionType: {
        id: 'questionType',
        labelKey: 'Question Type',
      },
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
