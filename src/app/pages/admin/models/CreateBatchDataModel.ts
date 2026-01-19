import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class CreateBatchDataModel extends FormEntity {
  batch = undefined;
  questionSet = '';
  endDate = '';
  startDate = '';

  metadata: Metadata = {
    validatorsMap: {
      batch: [Validators.required],
      questionSet: [Validators.required],
      startDate: [Validators.required],
      endDate: [Validators.required],
    },
    configMap: {
      batch: { id: 'batch', labelKey: 'Batch' },
      questionSet: { id: 'questionSet', labelKey: 'Question Set' },
      startDate: { id: 'startDate', labelKey: 'Start Date' },
      endDate: { id: 'endDate', labelKey: 'End Date' },
    },
  };
}
