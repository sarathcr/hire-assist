import { FormGroup } from '@angular/forms';
import { ConfigMap } from '../../../shared/utilities/form.utility';
import { PaginatedPayload } from '../../../shared/models/pagination.models';

export interface Assessment {
  id?: number;
  name: string;
  description: string;
  statusId: number;
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
