import { FormGroup } from '@angular/forms';
import { PaginatedPayload } from '../../../shared/models/pagination.models';
import { ConfigMap } from '../../../shared/utilities/form.utility';

export interface Batch {
  id: number;
  title: string;
  description: string;
  assessmentId: number;
  assessmentName: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  active: string;
  descriptionNew: string;
}
export interface BatchFormGroup extends Batch {
  formData: Batch;
  fGroup: FormGroup;
  configMap: ConfigMap;
}
export interface BatchAction {
  id: number;
  action: string;
}
export interface PaginationResponse {
  id: number;
  title: string;
  description: string;
  assessmentId: number;
  assessmentName: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  payload: PaginatedPayload;
}
