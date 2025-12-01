import { Validators } from '@angular/forms';
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
      name: [Validators.required],
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
}
