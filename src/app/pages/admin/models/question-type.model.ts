import { FormGroup } from '@angular/forms';
import { ConfigMap } from '../../../shared/utilities/form.utility';

export interface QuestionType {
  id?: number;
  questionType: string;
  createdBy?: string;
  createdAt?: string | Date;
  updatedBy?: string;
  updatedAt?: string | Date;
  questionCount?: number;
  activeRecruitmentCount?: number;
}

export interface QuestionTypeFormGroup {
  formData?: QuestionType;
  fGroup: FormGroup;
  configMap: ConfigMap;
}
