import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class AssignToBatchDataModel extends FormEntity {
  batch = undefined;

  metadata: Metadata = {
    validatorsMap: {
      batch: [Validators.required],
    },
    configMap: {
      batch: { id: 'batch', labelKey: 'Batch' },
    },
  };
}
