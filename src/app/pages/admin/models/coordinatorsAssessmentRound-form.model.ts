import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class CoordinatorsAssessmentRoundForm extends FormEntity {
  name = '';
  statusId = 0;
  assessmentId = 0;
  assessmentRoundId = 0;
  id = 0;
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
      statusId: { id: 'statusId', labelKey: 'Status' },
      assessmentId: { id: 'assessmentId', labelKey: 'AssessmentId' },
      assessmentRoundId: {
        id: 'assessmentRoundId',
        labelKey: 'AssessmentRoundId',
      },
      startDateTime: { id: 'startDateTime', labelKey: 'StartDate' },
      endDateTime: { id: 'endDateTime', labelKey: 'EndDate' },
      isActive: { id: 'isActive', labelKey: 'Active' },
      createdAt: { id: 'createdAt', labelKey: 'CreatedAt' },
    },
  };
}
