import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';
import { TokenData } from '../../../shared/models/token-data.models';

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

export interface LoginResponse {
  data: TokenData;
  errors: string[];
  succeeded: boolean;
}
