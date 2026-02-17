export interface StepperData {
  stepId: number;
  sidebarMenu: number;
  url?: string;
  assessmentId?: number;
  assessmentRoundId?: number;
  nextRoundId?: number;
  payload?: {
    assessmentRoundId?: number;
  };
}
export interface AssessmentFlow {
  id: number;
  statusId: number;
  scheduleAt: string; // ISO date string
  active: boolean;
  assessmentRoundId: number;
  round: string;
  sequence: number;
  interviewId: number;
  score: number;
}

export interface Candidate {
  assessmentId: number;
  candidateId: string;
  candidateName: string;
  email: string;
  roles: string[];
  assessmentFlow: AssessmentFlow[];
}
export interface CandidatePayload {
  candidateId: string;
  assessmentRoundId: number | null;
  isActive: boolean;
  statusId: number;
  assessmentId: number;
}
export interface CandidateData {
  id: string;
  name: string;
  email: string;
  score: string;
  status: string;
  isScheduled: string;
  scheduledDate: string;
  assessmentRoundId: number;
  interviewId?: number;
}
