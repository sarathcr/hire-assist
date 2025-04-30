import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class CreateBatchDataModel extends FormEntity {
  batch = undefined;
  questionSet = '';

  metadata: Metadata = {
    validatorsMap: {
      batch: [Validators.required],
      questionSet: [Validators.required],
    },
    configMap: {
      batch: { id: 'batch', labelKey: 'Batch' },
      questionSet: { id: 'questionSet', labelKey: 'Question Set' },
    },
  };
}
