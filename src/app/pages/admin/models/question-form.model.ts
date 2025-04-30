import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class QuestionForm extends FormEntity {
  questionText?: '';
  maxmark?: 0;
  options?: '';
  answer?: '';
  active?: false;
  hasAttachments?: false;
  questionType?: '';

  metadata: Metadata = {
    validatorsMap: {
      questionText: [Validators.required],
      questionType: [Validators.required],
      options: [Validators.required],
      answer: [Validators.required],
    },
    configMap: {
      questionText: { id: 'questionText', labelKey: 'QuestionText' },
      maxmark: { id: 'maxmark', labelKey: 'Max Mark' },
      questionType: { id: 'questionType', labelKey: 'Question Type' },
      options: { id: 'options', labelKey: 'Options' },
      answer: { id: 'answer', labelKey: 'Answer' },
      hasAttachments: { id: 'hasAttachments', labelKey: 'Attachments' },
      active: { id: 'active', labelKey: 'Active' },
    },
  };
}
