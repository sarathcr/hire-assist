import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class BatchForm extends FormEntity {
  title = '';
  description = '';
  isActive = false;

  metadata: Metadata = {
    validatorsMap: {
      title: [
        Validators.required,
        Validators.pattern('^[A-Za-z].*'),
        Validators.minLength(3),
        Validators.maxLength(25),
      ],
    },
    configMap: {
      title: { id: 'title', labelKey: 'Title' },
      description: { id: 'description', labelKey: 'Description' },
      isActive: { id: 'isActive', labelKey: 'Active' },
    },
  };
}
