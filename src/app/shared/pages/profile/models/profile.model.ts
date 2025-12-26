import { FormGroup, Validators } from '@angular/forms';
import {
  ConfigMap,
  FormEntity,
  Metadata,
} from '../../../utilities/form.utility';
export class ProfileForm extends FormEntity {
  designation = '';
  profileUrl = '';

  metadata: Metadata = {
    validatorsMap: {
      designation: [Validators.required],
    },
    configMap: {
      designation: { id: 'designation', labelKey: 'Designation' },
      profileUrl: { id: 'profileUrl', labelKey: 'profileUrl' },
    },
  };
}
export interface Profile {
  id?: string;
  designation?: string;
  profileUrl?: string;
}
export interface ProfileFormGroup extends Profile {
  formData: Profile;
  fGroup: FormGroup;
  configMap: ConfigMap;
}
