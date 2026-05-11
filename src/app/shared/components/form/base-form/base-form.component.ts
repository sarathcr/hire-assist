import { FormGroup } from '@angular/forms';
import { CustomFormControlConfig } from '../../../utilities/form.utility';

export abstract class BaseFormComponent {
  abstract formGroup: FormGroup;
  abstract config: CustomFormControlConfig;

  get errorMsg(): string {
    const fc = this.formGroup.get(this.config.id);

    if (!fc || (!fc.touched && !fc.dirty) || !fc.errors) {
      return '';
    }

    const errors = fc.errors;

    if (errors['errorMessage']) {
      return errors['errorMessage'];
    }

    if (errors['email']) {
      return 'Please enter a valid email address.';
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
    if (errors['duplicateOption']) {
      return 'This option already exists. Please enter a unique option.';
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
      } else if (
        this.config.labelKey === 'Contact Number' ||
        this.config.labelKey === 'Phone'
      ) {
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
    if (errors['hasSpecialCharsOrNumbers']) {
      return 'Special characters and numbers are not allowed.';
    }
    if (errors['notOnlyNumbers']) {
      return `${this.config.labelKey} cannot be numeric only.`;
    }
    if (errors['trailingSpaces']) {
      return 'Trailing spaces are not allowed.';
    }
    if (errors['onlyNumbers']) {
      return 'Only numeric values are allowed.';
    }
    if (errors['endDateTimeInvalid']) {
      return 'End date must be at least 1 hour after start date';
    }
    if (errors['futureDate']) {
      return 'Date cannot be in the future.';
    }
    if (errors['endDateInvalid']) {
      return 'End date cannot be before start date.';
    }
    if (errors['passwordMismatch']) {
      return 'Passwords do not match.';
    }
    if (errors['requireUppercase']) {
      return 'Must contain at least one uppercase letter.';
    }
    if (errors['requireLowercase']) {
      return 'Must contain at least one lowercase letter.';
    }
    if (errors['requireNumber']) {
      return 'Must contain at least one number.';
    }
    if (errors['requireSpecialChar']) {
      return 'Must contain at least one special character.';
    }
    if (errors['requireLength']) {
      return 'Must be at least 8 characters long.';
    }
    return 'This field has an invalid value.';
  }
}
