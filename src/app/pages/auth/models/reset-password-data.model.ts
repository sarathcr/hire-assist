import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class ResetPasswordData extends FormEntity {
  email = '';

  metadata: Metadata = {
    validatorsMap: {
      email: [Validators.required, Validators.email],
    },
    configMap: {
      email: { id: 'email', labelKey: 'Email' },
    },
  };
}
