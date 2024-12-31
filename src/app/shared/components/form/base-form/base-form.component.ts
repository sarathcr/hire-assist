import { FormGroup } from '@angular/forms';
import { CustomFormControlConfig } from '../../../utilities/form.utility';

// import { TranslateService } from '@ngx-translate/core';

export abstract class BaseFormComponent {
  abstract formGroup: FormGroup;
  abstract config: CustomFormControlConfig;

  //   constructor() {}

  // eslint-disable-next-line complexity
  get errorMsg(): string {
    let errorKey = '';
    const fcId = this.config.id;
    const formGroup = this.formGroup;
    const fc = formGroup.get(fcId);

    if (fc && fc.errors) {
      errorKey = Object.keys(fc.errors)[0];
    }
    const isSubmitted = true; //this.formGroup.dirty;

    if (fc && isSubmitted) {
      fc.markAsDirty();
    }
    const hasToShowError = fc?.dirty && errorKey;
    return hasToShowError ? `Field is ${errorKey}` : '';
  }
}
