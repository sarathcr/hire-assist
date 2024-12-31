import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class LoginData extends FormEntity {
  userName = '';
  password = '';

  metadata: Metadata = {
    validatorsMap: {
      userName: [Validators.required],
      password: [Validators.required],
    },
    configMap: {
      userName: { id: 'userName', labelKey: 'Username' },
      password: { id: 'password', labelKey: 'Password' },
    },
  };
}
