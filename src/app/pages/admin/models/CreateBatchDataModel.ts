import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class CreateBatchDataModel extends FormEntity {
  batch = undefined;
  questionSet = null;
  endDate = '';
  startDate = '';

  metadata: Metadata = {
    validatorsMap: {
      batch: [Validators.required],
      questionSet: [Validators.required],
      startDate: [Validators.required],
      endDate: [
        Validators.required,
        CreateBatchDataModel.validateEndDateTime(),
      ],
    },
    configMap: {
      batch: { id: 'batch', labelKey: 'Batch' },
      questionSet: { id: 'questionSet', labelKey: 'Question Set' },
      startDate: { id: 'startDate', labelKey: 'Start Date' },
      endDate: { id: 'endDate', labelKey: 'End Date' },
    },
  };

  private static validateEndDateTime(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control?.parent) {
        return null;
      }

      const startDateValue = control.parent.get('startDate')?.value;
      const endDateValue = control.value;

      if (!startDateValue || !endDateValue) {
        return null;
      }

      const startDate = new Date(startDateValue);
      const endDate = new Date(endDateValue);

      const diffInMs = endDate.getTime() - startDate.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return {
          endDateTimeInvalid: true,
        };
      }

      return null;
    };
  }
}
