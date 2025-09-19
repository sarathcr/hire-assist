/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CandidateGroup {
  key: string;
  candidates: any[];
  panelId?: number;
}

export interface CandidateData {
  key: string;
  [key: string]: any; // Allows for additional properties

  candidates: any[];
  panelId?: number;
}

export interface DialogData {
  duplicateRecords: CandidateData[];
  assessmentId: string;
}
