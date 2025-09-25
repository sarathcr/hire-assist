import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class PanelForm extends FormEntity {
  name = '';
  description = '';
  isActive = false;

  metadata: Metadata = {
    validatorsMap: {
      name: [
        Validators.required,
        Validators.maxLength(150),
        Validators.minLength(3),
        Validators.pattern('^[A-Za-z].*'),
      ],
    },
    configMap: {
      name: {
        id: 'name',
        labelKey: 'Name',
      },
      description: { id: 'description', labelKey: 'Description' },
      isActive: { id: 'isActive', labelKey: 'Active' },
    },
  };
}
