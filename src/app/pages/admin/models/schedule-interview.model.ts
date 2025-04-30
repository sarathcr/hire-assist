import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class ScheduleInterview extends FormEntity {
  scheduleDate: Date | undefined;
  metadata: Metadata = {
    validatorsMap: {
      scheduleDate: [Validators.required],
    },
    configMap: {
      scheduleDate: { id: 'scheduleDate', labelKey: 'Schedule Date' },
    },
  };
}
