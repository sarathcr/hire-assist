import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class CoordinatorModal extends FormEntity {
  id = '';
  coordinator = '';
  assessmentRound = 0;

  metadata: Metadata = {
    validatorsMap: {
      coordinator: [Validators.required],
      assessmentRound: [Validators.required],
    },
    configMap: {
      coordinator: { id: 'coordinator', labelKey: 'Coordinator' },
      assessmentRound: { id: 'assessmentRound', labelKey: 'Round' },
    },
  };
}
