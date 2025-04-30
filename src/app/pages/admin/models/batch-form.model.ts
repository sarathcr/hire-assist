import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class BatchForm extends FormEntity {
  title = '';
  description = '';
  startDate = '';
  endDate = '';
  isActive = false;

  metadata: Metadata = {
    validatorsMap: {
      title: [Validators.required],
      startDate: [Validators.required],
      endDate: [Validators.required],
    },
    configMap: {
      title: { id: 'title', labelKey: 'Title' },
      description: { id: 'description', labelKey: 'Description' },
      startDate: { id: 'startDate', labelKey: 'StartDate' },
      endDate: { id: 'endDate', labelKey: 'EndDate' },
      isActive: { id: 'isActive', labelKey: 'Active' },
    },
  };
}
