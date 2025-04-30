import { FormGroup } from '@angular/forms';
import { ConfigMap } from '../../../shared/utilities/form.utility';

export interface Questionsinterface {
  id?: number;
  questionText: string;
  maxMark: number;
  options: string[];
  answer: string;
  active: boolean;
  hasAttachment: boolean;
  questionType: string;
}

export interface OptionsInterface {
  options: string;
  hasAttachments: boolean;
  isCorrect: boolean;
}

export interface QuestionFormGroup extends Questionsinterface {
  formData: Questionsinterface;
  fGroup: FormGroup;
  configMap: ConfigMap;
}

export interface QuestionAction {
  id: number;
  action: string;
}
