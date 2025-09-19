import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';
import { passwordStrengthValidator } from '../../../shared/utilities/passwordStrengthValidator';

export class ResetPasswordChangeData extends FormEntity {
  newPassword = '';
  confirmPassword = '';

  metadata: Metadata = {
    validatorsMap: {
      newPassword: [Validators.required, passwordStrengthValidator],
      confirmPassword: [Validators.required, passwordStrengthValidator],
    },
    configMap: {
      newPassword: { id: 'newPassword', labelKey: 'New Password' },
      confirmPassword: { id: 'confirmPassword', labelKey: 'Confirm Password' },
    },
  };
}
