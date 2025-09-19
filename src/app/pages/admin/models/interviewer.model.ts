export interface InterviewerCandidate {
  assessmentId: number;
  assessmentName: string;
  candidateName: string;
  candidateId: string;
  interviewId: number;
  roundName: string;
  panelName: string;
  statusId: number; // Using the enum
  previousInterviews: PreviousInterview[];
}

export interface PreviousInterview {
  roundName: string;
  roundId: number;
  assessmentRoundId: number;
  comments: string;
  status: string;
  score: number;
  sequence: number;
  feedBacks: Feedback[] | [];
  assessmentDetails: AssessmentDetails[];
}

export interface Feedback {
  feedbackDetails: string;
  feedbackScore: number;
  criteria: string;
  maxScore: number;
}

export interface CandidateDetailRequest {
  assessmentId: number;
  candidateId: string;
  interviewId: number;
}

export interface RoundsAccordion {
  title: string;
  value: number;
  round: number;
  content: string | null;
  score: number | null;
  assessmentdetails: AssessmentDetails[];
  interviewers: InterviewerAccordion[] | [];
}
export interface InterviewerAccordion {
  name: string;
  score: number;
  feedbacks: Feedback[] | [];
}

export interface AssessmentDetails {
  score: number;
  panelName: string;
  questionSet: string;
  batch: string;
  totalQuestions: number;
  attendedQuestions: number;
  correctAswers: number;
  skipped: number;
  feedbackListDto: Feedback[] | [];
  interviewerId: string;
  interviewerName: string;
  totalScore: number;
  outofScore: number;
}

export interface AccordionData {
  id: number;
  title: string;
  value: number;
  content: string | null;
  score: number | null;
  maxScore: number | null;
  isSaved?: boolean | false;
  isScoreInValid: boolean | false;
  fileDto?: FileDto[];
}

export interface InterviewerFeedback {
  id?: number;
  interviewerId: string;
  candidateId: string;
  assessmentId: number;
  feedbackCriteriaId: number;
  feedbackDetails: string;
  feedbackScore: number;
  assessmentRoundId: number;
  interviewId: number;
  fileDto?: FileDto[];
}
export interface FileDto {
  id?: string;
  name?: string;
  path?: string;
  url?: string;
  blobId?: string;
  attachmentType?: number;
}
export interface Feedbackcriteria {
  id: number;
  criteria: string;
  maxScore: number;
  comments?: string;
  score?: number;
  feedbackId: number;
  fileDto?: FileDto[];
}

export interface Interview {
  id: number;
  candidateId?: string;
  panelId?: number;
  assessmentRoundId?: number;
  score?: number;
  hasAttachment?: boolean;
  date?: Date | string;
  comments?: string;
  isActive?: boolean;
  statusId?: number; // Using the enum
  assessmentId?: number;
}
export interface FileDto {
  id?: string;
  name?: string;
  path?: string;
  url?: string;
  blobId?: string;
  attachmentType?: number;
}
export interface FileRequest {
  attachmentType: number;
  file: File;
  files?: File[];
}
