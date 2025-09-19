import { FormGroup } from '@angular/forms';
import { ConfigMap } from '../../../shared/utilities/form.utility';

export interface Panel {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}
export interface PanelFormGroup extends Panel {
  formData: Panel;
  fGroup: FormGroup;
  configMap: ConfigMap;
}
export interface PanelAction {
  id: string;
  action: string;
}
