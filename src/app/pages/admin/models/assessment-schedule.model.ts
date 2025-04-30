import { FormGroup, Validators } from '@angular/forms';
import { Options } from '../../../shared/components/form/input-select/input-select.component';
import {
  ConfigMap,
  FormEntity,
  Metadata,
} from '../../../shared/utilities/form.utility';

export interface Candidate {
  id: number;
  name: string;
  email: string;
  batch?: string;
  questionSet?: string;
}
export interface schedule {
  select: string;
}
export interface AssessmentSchedule extends schedule {
  formData: schedule;
  fGroup: FormGroup;
  configMap: ConfigMap;
  inputSelect: Options[];
}

export interface RoundsInterface {
  id: number;
  name: string;
  sequence: number;
}
export interface AssessmentRoundsInterface {
  RoundId: number;
  name: string;
  sequence: number;
  assessmentId: number;
}

export interface RoundForm extends RoundsInterface {
  formData: RoundsInterface;
  fGroup: FormGroup;
  configMap: ConfigMap;
}

export class AssessmentScheduleModal extends FormEntity {
  id = '';
  round = '';

  metadata: Metadata = {
    validatorsMap: {
      round: [Validators.required],
    },
    configMap: {
      round: { id: 'round', labelKey: '' },
    },
  };
}

export class RoundModal extends FormEntity {
  id = '';
  name = '';
  sequence = 0;
  metadata: Metadata = {
    validatorsMap: {
      // round: [Validators.required],
      name: [Validators.required],
    },
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      sequence: { id: 'sequence', labelKey: 'Sequence' },
    },
  };
}
