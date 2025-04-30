import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class AssessmentForm extends FormEntity {
  name = '';
  description = '';
  statusId = 0;
  startDateTime = '';
  endDateTime = '';
  isActive = false;
  createdAt = '';

  metadata: Metadata = {
    validatorsMap: {
      statusId: [Validators.required],
      name: [Validators.required],
      startDateTime: [Validators.required],
      endDateTime: [Validators.required],
    },
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      description: { id: 'description', labelKey: 'Description' },
      statusId: { id: 'statusId', labelKey: 'Status' },
      startDateTime: { id: 'startDateTime', labelKey: 'StartDate' },
      endDateTime: { id: 'endDateTime', labelKey: 'EndDate' },
      isActive: { id: 'isActive', labelKey: 'Active' },
    },
  };
}
