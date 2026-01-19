import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';
import { Candidate } from './assessment-schedule.model';
import { minAgeValidator } from '../../../shared/utilities/dob.utility';

export class CandidateDataModel extends FormEntity {
  id = '';
  name = '';
  email = '';
  // batch = undefined;
  // questionSet = undefined;
  dob = '';
  gender = '';
  phone = '';
  // endDate = '';
  // startDate = '';
  metadata: Metadata = {
    validatorsMap: {
      name: [
        Validators.required,
        Validators.pattern('^[A-Za-z].*'),
        Validators.minLength(3),
        Validators.maxLength(50),
        CandidateDataModel.noExtraSpacesValidator,
        CandidateDataModel.noSpecialCharsOrNumbersValidator,
      ],
      email: [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      ],
      dob: [Validators.required, minAgeValidator(18)],
      gender: [Validators.required],
      phone: [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)],
      // startDate: [Validators.required],
      // endDate: [Validators.required],
      // batch: [Validators.required],
      // questionSet: [Validators.required],
    },
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      email: { id: 'email', labelKey: 'Email' },
      // batch: { id: 'batch', labelKey: 'Batch' },
      // questionSet: { id: 'questionSet', labelKey: 'Question Set' },
      dob: { id: 'dob', labelKey: 'Date of Birth' },
      gender: {
        id: 'gender',
        labelKey: 'Gender',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' },
        ],
      },
      phone: { id: 'phone', labelKey: 'Contact Number' },
      // startDate: { id: 'startDate', labelKey: 'StartDate' },
      // endDate: { id: 'endDate', labelKey: 'EndDate' },
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
  private static noSpecialCharsOrNumbersValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const hasForbiddenChars = /[^a-zA-Z\s]/.test(value);

    if (hasForbiddenChars) {
      return { hasSpecialCharsOrNumbers: true };
    }
    return null;
  }
}

export interface DeleteAction {
  id: string;
  action: string;
}

export interface EditAction {
  userData: Candidate;
  action: string;
}

export interface CandidateModel {
  id: string;
  name: string;
  email: string;
  batchId: number;
  batchName: string;
  isAlreadyExist?: boolean;
  endDateTime?: string;
  startDateTime?: string;
}

export interface CandidateApplicationQuestions {
  id: number;
  question: string;
}

export interface CandidateBatchCheckResponse {
  isAllCandidatesAssigned: boolean;
  unassignedCandidatesCount: number;
  UnassignedCandidate: string;
}

export interface CandidateBatchCheckRequest {
  assessmentId: string;
  candidateIds?: string[];
}

export interface candidateDetails {
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dob: Date;
  answers?: CandidateApplicationAnswers[];
}
export interface CandidateApplicationAnswers {
  question: string;
  answer: string;
}
export interface candidatePreviousAssessments {
  assessmentId: number;
  assessmentName: string;
  roundsDetails: roundDetailsList[];
}
export interface roundDetailsList {
  assessmentRoundId: number;
  roundName: string;
  roundId: number;
  sequence: number;
  status: string;
  assessmentDetails: roundDetails[];
}
export interface roundDetails {
  date?: Date;
  questionSet?: string;
  attendedQuestions?: number;
  totalQuestions?: number;
  correctAnswers: number;
  batch?: string;
  totalScore?: number;
  skipped?: number;
  interviewerId: string;
  interviewerName?: string;
  outofScore?: number;
  feedbackListDto: feedbackList[];
}
export interface feedbackList {
  feedbackDetails?: string;
  feedbackScore?: number;
  criteria: string;
  maxScore?: number;
}
