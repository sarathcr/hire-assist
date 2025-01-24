import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';
import { TokenData } from '../../../shared/models/token-data.models';

export class LoginData extends FormEntity {
  email = '';
  password = '';

  metadata: Metadata = {
    validatorsMap: {
      email: [Validators.required],
      password: [Validators.required],
    },
    configMap: {
      email: { id: 'email', labelKey: 'Email' },
      password: { id: 'password', labelKey: 'Password' },
    },
  };
}

export interface LoginResponse {
  data: TokenData;
  errors: string[];
  succeeded: boolean;
}
