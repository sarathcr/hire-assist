import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Options } from '../../../shared/components/form/input-select/input-select.component';
import { Option } from '../../../shared/models/option';
import {
  ConfigMap,
  FormEntity,
  Metadata,
} from '../../../shared/utilities/form.utility';
import { CoordinatorDto } from './assessment.model';

export interface Candidate {
  id: number;
  name: string;
  email: string;
  batch?: string;
  questionSet?: string;
  isDuplicate: boolean;
  isAlreadyExist: boolean;
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
  description: string;
}

export interface QuestionSetFormInterface {
  id: number;
  title: string;
  description: string;
  assessmentId: number;
}

export interface AssessmentRoundsInterface {
  RoundId: number;
  name: string;
  sequence: number;
  assessmentId?: number;
}

export interface RoundForm extends RoundsInterface {
  formData: RoundsInterface;
  fGroup: FormGroup;
  configMap: ConfigMap;
}

export interface QuestionSetForm extends QuestionSetFormInterface {
  formData: QuestionSetFormInterface;
  fGroup: FormGroup;
  configMap: ConfigMap;
}

export class AssessmentScheduleModal extends FormEntity {
  id = '';
  round = '';
  name = '';
  description = '';

  metadata: Metadata = {
    validatorsMap: {
      round: [Validators.required],
      description: [Validators.maxLength(150)],
    },
    configMap: {
      round: { id: 'round', labelKey: 'Select Rounds' },
      name: { id: 'name', labelKey: 'Name' },
      description: { id: 'description', labelKey: 'Description' },
    },
  };
}

export class CoordinatorDataModel extends FormEntity {
  assessmentRoundsDetails: AssessmentRoundData[] = [];

  override metadata: Metadata = {
    validatorsMap: {},
    configMap: {},
  };
}

export class SelectQuestionsModal extends FormEntity {
  questionSet = undefined;

  metadata: Metadata = {
    validatorsMap: {
      questionSet: [Validators.required],
    },
    configMap: {
      questionSet: { id: 'questionSet', labelKey: 'Question Set' },
    },
  };
}

export class RoundModal extends FormEntity {
  id = '';
  name = '';
  sequence = 0;
  metadata: Metadata = {
    validatorsMap: {
      name: [Validators.required],
    },
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      sequence: { id: 'sequence', labelKey: 'Sequence' },
    },
  };
}

export interface InterviewSummary {
  id: string;
  name: string;
  email: string;
  score: number;
  status: string;
  isScheduled: boolean;
  scheduledDate: Date;
  assessmentRoundId: number;
}

export interface PanelSummary {
  id: string;
  panelName: string;
  panelDescription?: string;
  interviewers?: Interviewer[];
  status: string;
}

export interface Interviewer {
  id: string;
  name: string;
}

export class QuestionSetFormModal extends FormEntity {
  id = 0;
  questionSet = undefined;
  description = '';
  title = '';

  metadata: Metadata = {
    validatorsMap: {
      title: [
        Validators.required,
        Validators.pattern('^[A-Za-z].*'),
        Validators.minLength(3),
        Validators.maxLength(25),
        QuestionSetFormModal.noExtraSpacesValidator,
      ],
      description: [
        Validators.required,
        Validators.pattern('^[A-Za-z].*'),
        Validators.minLength(3),
        Validators.maxLength(150),
        QuestionSetFormModal.noExtraSpacesValidator,
      ],
    },
    configMap: {
      title: { id: 'title', labelKey: 'Title' },
      description: { id: 'description', labelKey: 'Description' },
      questionSet: { id: 'questionSet', labelKey: 'Question Set' },
    },
  };

  private static noExtraSpacesValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;

    if (/\s{2,}/.test(value)) {
      return { extraSpaces: true };
    }
    return null;
  }
}

export interface BatchSummaryModel {
  id: number;
  title: string;
  description: string;
  assessmentId: number;
  assessmentName: string | null;
  isActive: boolean;
  startDate: string;
  endDate: string;
  active: string;
  descriptionNew: string;
}

export interface paneldata {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  isAssigned: boolean;
  active: string;
  assigned: string;
}

export interface InterviewByPanel {
  id?: number;
  email?: string;
  name?: string;
  status?: string;
  score?: string;
  assessemntRoundId?: number;
  roundName?: string;
  interviewDate: string;
}

export interface CordinatorData {
  cordinators: Option[];
  assessmentRounds: Option[];
  assessmentId: number;
  cordinatorRoundData: CoordinatorDto; // This uses the corrected type
}

export interface AssessmentRoundData {
  coordinator: string;
  assessmentRound: string;
}

export interface PanelInterviewerdData {
  panel: string;
  interviewers: string;
}
export interface CreatePanel {
  name: string;
  isActive: boolean;
  isAssigned: boolean;
  description: string;
}
