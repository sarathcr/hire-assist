import { FormGroup } from '@angular/forms';
import { CustomFormControlConfig } from '../../../utilities/form.utility';

export abstract class BaseFormComponent {
  abstract formGroup: FormGroup;
  abstract config: CustomFormControlConfig;

  get errorMsg(): string {
    const fc = this.formGroup.get(this.config.id);

    if (!fc || !fc.touched || !fc.errors) {
      return '';
    }

    const errors = fc.errors;

    if (errors['errorMessage']) {
      return errors['errorMessage'];
    }

    if (errors['required']) {
      return 'This field is required.';
    }

    if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return `This field accepts a maximum of ${requiredLength} characters.`;
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `This field must be at least ${requiredLength} characters long.`;
    }
    if (errors['pattern']) {
      return `This field must be start with alphabetics`;
    }
    return 'This field has an invalid value.';
  }
}
