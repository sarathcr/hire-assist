import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class QuestionForm extends FormEntity {
  questionText?: string = '';
  maxmark?: number = 0;
  options?: string[] = [];
  answer?: string = '';
  active?: boolean = false;
  hasAttachments?: boolean = false;
  questionType?: string = '';

  metadata: Metadata = {
    validatorsMap: {
      questionText: [Validators.required],
      questionType: [Validators.required],
      options: [Validators.required],
      answer: [Validators.required],
    },
    configMap: {
      questionText: { id: 'questionText', labelKey: 'Question Text' },
      maxmark: { id: 'maxmark', labelKey: 'Max Mark' },
      questionType: { id: 'questionType', labelKey: 'Question Type' },
      options: { id: 'options', labelKey: 'Options' },
      answer: { id: 'answer', labelKey: 'Answer' },
      hasAttachments: { id: 'hasAttachments', labelKey: 'Attachments' },
      active: { id: 'active', labelKey: 'Active' },
    },
  };
}
