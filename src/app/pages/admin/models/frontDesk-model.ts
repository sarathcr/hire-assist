import { FormGroup, Validators } from '@angular/forms';
import {
  ConfigMap,
  FormEntity,
  Metadata,
} from '../../../shared/utilities/form.utility';
import { Options } from '../../candidate/models/candidate-test-question-set.model';

export interface frontDeskInterface {
  id?: number;
  UserId: string;
  AssessmentId: number;
  name?: string;
}
export interface frontDeskResponse {
  id: number;
  userId?: string;
  assessmentId?: number;
  name?: string;
}
export interface schedule {
  select: string;
}
export interface frontDesk extends schedule {
  formData: schedule;
  fGroup: FormGroup;
  configMap: ConfigMap;
  inputSelect: Options[];
}
export class frontDeskModal extends FormEntity {
  id = '';
  users = '';

  metadata: Metadata = {
    validatorsMap: {
      users: [Validators.required],
    },
    configMap: {
      users: { id: 'users', labelKey: '' },
    },
  };
}

export interface FrontDeskFormGroup {
  id: number;
  name: string;
  userId: string;
  assessmentId: number;
}
