import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../utilities/form.utility';

export class Profile extends FormEntity {
  name = '';
  email = '';
  role = '';

  metadata: Metadata = {
    validatorsMap: {
      name: [Validators.required],
      email: [Validators.required],
      position: [Validators.required],
    },
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      email: { id: 'email', labelKey: 'Email' },
      role: { id: 'role', labelKey: 'Role' },
    },
  };
}
