import { FormGroup } from '@angular/forms';
import { ConfigMap } from '../../../shared/utilities/form.utility';

export interface Questionsinterface {
  id: number;
  questionText: string;
  maxmark: number;
  options: OptionsInterface;
  answer: string;
  active: boolean;
  hasAttachments: boolean;
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
