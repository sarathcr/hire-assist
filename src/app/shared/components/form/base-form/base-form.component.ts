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
      return `Must not exceed ${requiredLength} characters.`;
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `Must be at least ${requiredLength} characters.`;
    }
    if (errors['pattern']) {
      if (
        this.config.labelKey === 'Title' ||
        this.config.labelKey === 'Name' ||
        this.config.labelKey === 'Description'
      ) {
        return `Must begin with an alphabetic character.`;
      } else if (
        this.config.labelKey === 'Question Text' ||
        this.config.labelKey === 'Options'
      ) {
        return `Whitespace is not allowed at the beginning`;
      } else if (this.config.labelKey === 'User Name') {
        return `Please enter a valid user name`;
      } else if (this.config.labelKey === 'Contact Number') {
        return `Please enter a valid phone number`;
      } else if (this.config.labelKey === 'Email') {
        return `Please enter a valid email address`;
      } else {
        return `This field has an invalid value.`;
      }
    }
    if (errors['max']) {
      const requiredLength = errors['max'].max;
      return `Value must not exceed  ${requiredLength}.`;
    }

    if (errors['min']) {
      const requiredLength = errors['min'].min;
      return `Value must be at least ${requiredLength}.`;
    }
    if (errors['extraSpaces']) {
      return 'No consecutive spaces allowed.';
    }
    if (errors['onlyNumbers']) {
      return 'Only numeric values are allowed.';
    }
    return 'This field has an invalid value.';
  }
}
