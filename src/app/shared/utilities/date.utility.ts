import { FormGroup } from '@angular/forms';

export const formatDate = (inputDate: string): string => {
  if (!inputDate) {
    return '';
  }

  const dateParts = inputDate.split('-');

  if (dateParts.length === 3 && dateParts[2].length === 4) {
    const [day, month, year] = dateParts.map((part) => part.padStart(2, '0'));
    inputDate = `${year}-${month}-${day}`;
  }

  const date = new Date(inputDate);

  if (isNaN(date.getTime())) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isValidStartDate = (startDate: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  return startDate >= today;
};

export const isValidEndDate = (
  startDate: Date,
  endDate: Date,
): { valid: boolean; error?: 'equalToStart' | 'beforeStart' } => {
  if (endDate.getTime() === startDate.getTime()) {
    return { valid: false, error: 'equalToStart' };
  }

  if (endDate < startDate) {
    return { valid: false, error: 'beforeStart' };
  }

  return { valid: true };
};

export function validateStartAndEndDates(
  form: FormGroup,
  startDate: string,
  endDate: string,
): void {
  const startDateControl = form.get(startDate);
  const endDateControl = form.get(endDate);

  const startValue = startDateControl?.value;
  const endValue = endDateControl?.value;

  startDateControl?.setErrors(null);
  endDateControl?.setErrors(null);

  let hasStartError = false;
  let hasEndError = false;

  if (!startValue) {
    startDateControl?.setErrors({ required: true });
    hasStartError = true;
  }

  if (!endValue) {
    endDateControl?.setErrors({ required: true });
    hasEndError = true;
  }

  const startDateTime = new Date(startValue);
  const endDateTime = new Date(endValue);

  if (!hasStartError) {
    if (!isValidStartDate(startDateTime)) {
      startDateControl?.setErrors({
        errorMessage: 'Start date must be today or later.',
      });
      hasStartError = true;
    }
  }

  if (!hasStartError && !hasEndError) {
    const endDateValidation = isValidEndDate(startDateTime, endDateTime);

    if (!endDateValidation.valid) {
      const error =
        endDateValidation.error === 'equalToStart'
          ? 'Start and End dates must be different.'
          : 'End date must follow start date.';

      endDateControl?.setErrors({ errorMessage: error });
    }
  }
}
