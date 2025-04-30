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
}

export interface Options {
  id: number;
  optionText: string;
  hasAttachments: boolean;
}
