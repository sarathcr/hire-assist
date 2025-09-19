/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormGroup, Validators } from '@angular/forms';
import {
  ConfigMap,
  FormEntity,
  Metadata,
} from '../../../shared/utilities/form.utility';
import { Options } from '../../candidate/models/candidate-test-question-set.model';

export interface interviewerInterface {
  id?: number;
  panelId?: number;
  interviewers: string[];
  panelName?: string;
}

export interface interviewer extends interviewerInterface {
  formData: interviewerInterface;
  fGroup: FormGroup;
  configMap: ConfigMap;
  inputSelect: Options[];
}
export class interviewerModal extends FormEntity {
  id = '';
  interviewers = '';
  panels = '';
  metadata: Metadata = {
    validatorsMap: {
      interviewers: [Validators.required],
    },
    configMap: {
      interviewers: { id: 'interviewers', labelKey: 'Interviewers' },
      panels: { id: 'panels', labelKey: 'Panels' },
    },
  };
}

export interface interviewerFormGroup {
  id?: number;
  panelId: number;
  interviewers: string[];
}
export interface InterviewerPanelAssignment {
  id?: number;
  panelId: number;
  interviewerId: string;
}
