import { FormGroup } from '@angular/forms';
import { ConfigMap } from '../../../shared/utilities/form.utility';

export interface InterviewPanels {
  id?: string;
  panelName?: string;
  assessmentId: number;
  interviewId: number;
  panelId: string | number;
  interviewers: Interviewers[];
}
export interface GetInterviewPanelsResponse {
  id?: string;
  panel: string;
  assessmentId: number;
  interviewId: number;
  panelId: string | number;
  interviewer: Interviewers[];
}

export interface InterviewPanelsResponse {
  panel: string;
  assessmentId: number;
  interviewId: number;
  interviewer: Interviewers[];
}
export interface Interviewers {
  id: string;
}
export interface InterviewPanelFormGroup extends InterviewPanels {
  formData: InterviewPanels;
  fGroup: FormGroup;
  configMap: ConfigMap;
}
export interface InterviewPanelAction {
  id: string;
  action: string;
}

export interface panelAssignment {
  panelId: number;
  interviewers: string[];
}
