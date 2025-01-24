import { Validators } from "@angular/forms";
import { FormEntity, Metadata } from "../utilities/form.utility";

export class Profile extends FormEntity {
  fName = '';
  lName = '';
  email = '';
  position = '';
  dob = '';

  metadata: Metadata = {
    validatorsMap: {
        fName: [Validators.required],
        email: [Validators.required],
        position: [Validators.required]
    },
    configMap: {
        fName: { id: 'fName', labelKey: 'First Name' },
        lName: { id: 'lName', labelKey: 'Last Name' },
        email: { id: 'email', labelKey: 'Email' },
        position: { id: 'position', labelKey: 'Position' },
        dob: { id: 'dob', labelKey: 'Date Of Birth' }
    },
  }
}