import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';
import { Candidate } from './assessment-schedule.model';

export class CandidateDataModel extends FormEntity {
  id = '';
  name = '';
  email = '';
  batch = undefined;
  questionSet = undefined;
  dob = '';
  gender = '';
  phone = '';
  endDate = '';
  startDate = '';
  metadata: Metadata = {
    validatorsMap: {
      name: [Validators.required],
      email: [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      ],
      dob: [Validators.required],
      gender: [Validators.required],
      phone: [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)],
      startDate: [Validators.required],
      endDate: [Validators.required],
      batch: [Validators.required],
      questionSet: [Validators.required],
    },
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      email: { id: 'email', labelKey: 'Email' },
      batch: { id: 'batch', labelKey: 'Batch' },
      questionSet: { id: 'questionSet', labelKey: 'Question Set' },
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
      startDate: { id: 'startDate', labelKey: 'StartDate' },
      endDate: { id: 'endDate', labelKey: 'EndDate' },
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
