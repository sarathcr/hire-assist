import { Validators } from '@angular/forms';
import { FormEntity, Metadata } from '../../../shared/utilities/form.utility';

export interface RolesAccess {
  id?: string;
  name?: string;
  email?: string;
  roles?: string[];
  department?: string;
  action?: string[];
}

export class UserRoleAccessDataModel extends FormEntity {
  id = '';
  name = '';
  email = '';
  roles = '';
  department = undefined;

  metadata: Metadata = {
    validatorsMap: {
      name: [Validators.required],
      email: [Validators.required],
      roles: [Validators.required],
      department: [Validators.required],
    },
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      email: { id: 'email', labelKey: 'Email' },
      department: { id: 'department', labelKey: 'Department' },
      roles: { id: 'roles', labelKey: 'Roles' },
    },
  };
}

export interface DeleteAction {
  id: string;
  action: string;
}

export interface EditAction {
  userData: RolesAccess;
  action: string;
}
