import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class QuestionForm extends FormEntity {
  questionText?: string = '';
  maxmark?: number = 0;
  options?: string[] = [];
  answer?: string = '';
  active?: boolean = false;
  hasAttachments?: boolean = false;
  questionType?: string;
  optionHasAttachments?: boolean = false;
  isMultipleChoice?: boolean = false;
  attachmentType?: string;
  optionAttachmentType?: string;
  file?: File;
  metadata: Metadata = {
    validatorsMap: {
      questionText: [Validators.required, Validators.minLength(10)],
      questionType: [Validators.required],
      options: [Validators.required],
      answer: [Validators.required],
      maxmark: [Validators.required, Validators.min(1), Validators.max(10)],
    },
    configMap: {
      questionText: { id: 'questionText', labelKey: 'Question Text' },
      maxmark: { id: 'maxmark', labelKey: 'Max Mark' },
      questionType: { id: 'questionType', labelKey: 'Question Type' },
      options: { id: 'options', labelKey: 'Options' },
      answer: { id: 'answer', labelKey: 'Answer' },
      hasAttachments: {
        id: 'hasAttachments',
        labelKey: 'Enable Question Attachments',
      },
      active: { id: 'active', labelKey: 'Active' },
      optionHasAttachments: {
        id: 'optionHasAttachments',
        labelKey: 'Enable Option Attachments',
      },
      isMultipleChoice: {
        id: 'isMultipleChoice',
        labelKey: 'Allow Multiple Answers',
      },
      attachmentType: { id: 'attachmentType', labelKey: 'Attachment Type' },
      optionAttachmentType: {
        id: 'optionAttachmentType',
        labelKey: 'Option Attachment Type',
      },
      file: {
        id: 'file',
        labelKey: 'Files',
      },
    },
  };
}
