export interface CandidateTestQuestionSet {
  questionSetId: number;
  questions: Questions[];
}

export interface Questions {
  id: number;
  text: string;
  hasAttachment: boolean;
  isMultipleChoice: boolean;
  options: Options[];
  status?: 'reviewed' | 'skipped' | 'saved' | 'unAttended' | 'paused';
  file?: FileDto[];
}
export interface FileDto {
  id?: string;
  name?: string;
  path?: string;
  url?: string;
  blobId?: string;
  attachmentType?: number;
}
export interface Options {
  id: number;
  optionText: string;
  hasAttachments: boolean;
  url?: string;
  file?: FileDto[];
}
