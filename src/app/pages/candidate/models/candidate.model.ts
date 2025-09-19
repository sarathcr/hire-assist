export interface CandidateAssessment {
  interviewId: number;
  candidateId: string;
  assessmentRoundId: number;
  score: number;
  date: string;
  isActive: boolean;
  statusId: number;
  assessmentId: number;
  assessmentName: string;
  startTime: string;
  endTime: string;
  round: string;
  batch: string;
  totalQuestions: number;
}
