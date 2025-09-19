import { FormGroup } from '@angular/forms';
import { ConfigMap } from '../../../shared/utilities/form.utility';

export interface Questionsinterface {
  id?: number;
  questionText: string;
  hasAttachment: boolean;
  maxMark: number;
  active: boolean;
  isMultipleChoice: boolean;
  questionType: string;
  options: string[];
  answer: string[];
  file?: FileDto;
}
export interface OptionsForQuestionSetInterface {
  optionText: string;
  hasAttachments: boolean;
  isCorrect: boolean;
}
export interface OptionsInterface {
  optionText: string;
  hasAttachment: boolean;
  isCorrect: boolean;
  fileId?: string;
  name?: string;
  path?: string;
  url?: string;
  blobId?: string;
  attachmentType?: number;
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
export interface FileInterface {
  id?: number;
  optionAttachmentType?: string;
  file?: File;
}

export interface QuestionFormGroup extends Questionsinterface {
  formData: Questionsinterface;
  fGroup: FormGroup;
  configMap: ConfigMap;
}
export interface FileFormGroup extends FileInterface {
  formData: FileInterface;
  fGroup: FormGroup;
  configMap: ConfigMap;
}
export interface QuestionAction {
  id: number;
  action: string;
}

export interface QuestionsModel {
  id: string;
  questionText: string;
  maxMark: number;
  options: OptionsForQuestionSetInterface[];
  answer: string;
  active: boolean;
  hasAttachment: boolean;
  questionType: string;
  isExpanded?: boolean;
}

export interface QuestionSetsConfigData {
  assessmentId: string;
}

export interface QuestionSetModel {
  id: number;
  assessmentId: number;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface QuestionSet {
  id: number;
  name: string;
}

export interface GetSelectedQuestionsForSet {
  questionSetId: string;
  questions: QuestionsSetQuesions[];
}

export interface SelectQuestionsAndSetModel {
  questionSetId: string;
  questionIds: string[];
}

export interface MarkAsPresentRequest {
  InterviewsId: string;
}

export interface AssignToAnotherBatchRequest {
  BatchQuestionSetId: string;
  BatchId: string;
}

export interface QuestionsSetQuesions {
  questionId: number;
  questionType: string;
  maxMark: number;
}
