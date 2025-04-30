export interface CandidateAssessment {
  interviewId: number;
  assessmentId: number;
  candidateId: string;
  assessmentName: string;
  assessmentRoundId: number;
  score: number;
  date: string;
  isActive: boolean;
  statusId: number;
}
