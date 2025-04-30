import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';
import { Candidate } from './assessment-schedule.model';

export class CandidateDataModel extends FormEntity {
  id = '';
  name = '';
  email = '';
  batch = undefined;
  questionSet = undefined;

  metadata: Metadata = {
    validatorsMap: {
      name: [Validators.required],
      email: [Validators.required],
    },
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      email: { id: 'email', labelKey: 'Email' },
      batch: { id: 'batch', labelKey: 'Batch' },
      questionSet: { id: 'questionSet', labelKey: 'Question Set' },
    },
  };
}

export interface DeleteAction {
  id: string;
  action: string;
}

export interface EditAction {
  userData: Candidate;
  action: string;
}
