import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordStrengthValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  const isValidLength = value.length >= 8;

  const passwordValid =
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar &&
    isValidLength;

  return passwordValid ? null : { weak: true };
}
