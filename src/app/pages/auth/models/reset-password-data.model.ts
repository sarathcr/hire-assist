import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class ResetPasswordData extends FormEntity {
  email = '';

  metadata: Metadata = {
    validatorsMap: {
      email: [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      ],
    },
    configMap: {
      email: { id: 'email', labelKey: 'Email' },
    },
  };
}
