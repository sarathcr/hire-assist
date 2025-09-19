import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class PanelForm extends FormEntity {
  name = '';
  description = '';
  isActive = false;

  metadata: Metadata = {
    validatorsMap: {
      name: [Validators.required],
    },
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      description: { id: 'description', labelKey: 'Description' },
      isActive: { id: 'isActive', labelKey: 'Active' },
    },
  };
}
