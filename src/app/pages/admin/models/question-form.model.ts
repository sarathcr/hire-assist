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
      questionText: [Validators.required],
      questionType: [Validators.required],
      options: [Validators.required],
      answer: [Validators.required],
      optionAttachmentType: [Validators.required],
      file: [Validators.required],
    },
    configMap: {
      questionText: { id: 'questionText', labelKey: 'Question Text' },
      maxmark: { id: 'maxmark', labelKey: 'Max Mark' },
      questionType: { id: 'questionType', labelKey: 'Question Type' },
      options: { id: 'options', labelKey: 'Options' },
      answer: { id: 'answer', labelKey: 'Answer' },
      hasAttachments: { id: 'hasAttachments', labelKey: 'Attachments' },
      active: { id: 'active', labelKey: 'Active' },
      optionHasAttachments: {
        id: 'optionHasAttachments',
        labelKey: 'optionHasAttachments',
      },
      isMultipleChoice: {
        id: 'isMultipleChoice',
        labelKey: 'isMultipleChoice',
      },
      attachmentType: { id: 'attachmentType', labelKey: 'AttachmentType' },
      optionAttachmentType: {
        id: 'optionAttachmentType',
        labelKey: 'Option AttachmentType',
      },
      file: {
        id: 'file',
        labelKey: 'Files',
      },
    },
  };
}
