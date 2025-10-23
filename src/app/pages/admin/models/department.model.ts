import { FormGroup } from '@angular/forms';
import { ConfigMap } from '../../../shared/utilities/form.utility';

export interface Department {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
  active: string;
}
export interface DepartmentFormGroup extends Department {
  formData: Department;
  fGroup: FormGroup;
  configMap: ConfigMap;
}
export interface DepartmentAction {
  id: string;
  action: string;
}
