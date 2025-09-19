import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export class ReferPanelModel extends FormEntity {
  comments = '';

  metadata: Metadata = {
    validatorsMap: {
      comments: [Validators.required],
    },
    configMap: {
      comments: { id: 'comments', labelKey: 'Comments' },
    },
  };
}
