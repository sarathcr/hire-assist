import { FormGroup } from '@angular/forms';
import { PaginatedPayload } from '../../../shared/models/pagination.models';
import {
  ConfigMap,
  FormEntity,
  Metadata,
} from '../../../shared/utilities/form.utility';

export interface Assessment {
  id?: number;
  name: string;
  description?: string;
  statusId: number;
  panel?: number;
  startDateTime: string;
  endDateTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  rounds?: AssessmentRounds[];
  users?: AssessmentUsers[];
  activeRoundsPercentage?: number;
}

export interface AssessmentDetails {
  id: number;
  name: string;
  description: string;
  statusId: number;
  startDateTime: string;
  endDateTime: string;
  isActive: boolean;
  rounds: AssessmentRound[];
}

export interface AssessmentRounds {
  roundId: number;
  roundName: string;
  roundStatus: string;
}
export interface AssessmentUsers {
  userId: string;
  role: string;
}

export interface AssessmentAction {
  id: number;
  action: string;
}

export interface AssessmentFormGroup extends Assessment {
  formData: Assessment;
  fGroup: FormGroup;
  configMap: ConfigMap;
}

export interface PaginationResponse {
  id: number;
  name: string;
  description: string;
  statusId: number;
  startDateTime: string;
  endDateTime: string;
  isActive: boolean;
  payload: PaginatedPayload;
}

export interface AssessmentRound {
  id: number;
  roundId: number;
  round: string;
  statusId: number;
  status: string;
  sequence: number;
  isActive: boolean;
}

export class Score extends FormEntity {
  score = '';
  file?: File;
  metadata: Metadata = {
    validatorsMap: {},
    configMap: {
      score: { id: 'score', labelKey: 'Score' },
      file: {
        id: 'file',
        labelKey: 'Files',
      },
    },
  };
}

export interface AssessmentRoundFormGroup {
  id: string;
  name: string;
  timerHour?: number;
  durationDate?: Date;
  maxTerminationCount?: number;
}

export interface CoordinatorRoundDto {
  assessmentRoundId: number;
  coordinatorId?: string[]; // optional (matches List<string>?)
}

export interface CoordinatorRoundItemDto {
  assessmentRoundId: string[];
  coordinatorId: string[];
}

export interface CoordinatorDto {
  assessmentId: number;
  coordinatorRound: CoordinatorRoundItemDto[];
}
export interface CoordinatorResponseDto {
  id: number;
  coordinatorId: string;
  assessmentId: number;
  assessmentRoundId: number;
}

export interface Batch {
  id: string;
  name: string;
  scheduledTime: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  reportingTime: string;
  statusId?: number;
  batchQuestionSetsId?: string | number;
}

export interface CoordinatorAssessmentRounds {
  id: number;
  name: string;
  assessmentId: number;
  assessmentRoundId: number;
  statusId: number;
  startDateTime: string;
  endDateTime: string;
  isActive: boolean;
  createdAt: string;
}

export interface FileDto {
  Id: string;
  Name: string;
  Path: string;
  Url: string;
  AttachmentType: number;
}

export interface IdProofRequest {
  blobId: string;
  attachmentTypeId: number;
  candidateId: string;
}

export interface IdProofUploadRequest {
  CandidateId: string;
  IdType: number;
  Description: string;
  File: File;
}
