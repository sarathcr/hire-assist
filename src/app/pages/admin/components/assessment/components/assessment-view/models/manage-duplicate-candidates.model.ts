/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CandidateGroup {
  groupId: string;
  key: string;
  candidates: any[];
  panelId?: number;
}

export interface CandidateData {
  groupId: string;
  key: string;
  [key: string]: any; // Allows for additional properties

  candidates: any[];
  panelId?: number;
}

export interface DialogData {
  duplicateRecords: CandidateData[];
  assessmentId: string;
  applicationQuestions: any[];
}
