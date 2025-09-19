import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { InputTextareaComponent } from '../../../../../../shared/components/form/input-textarea/input-textarea.component';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../shared/utilities/form.utility';
import { ReferPanelModel } from '../../../../models/refer-panel.model';

@Component({
  selector: 'app-refer-candidate-panel-modal',
  imports: [InputTextareaComponent, ButtonComponent],
  templateUrl: './refer-candidate-panel-modal.component.html',
  styleUrl: './refer-candidate-panel-modal.component.scss',
})
export class ReferCandidatePanelModalComponent implements OnInit {
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;
  public referPanelModel = new ReferPanelModel();

  constructor(private ref: DynamicDialogRef) {
    this.fGroup = buildFormGroup(this.referPanelModel);
  }
  ngOnInit(): void {
    this.setConfigMaps();
  }
  public onSubmit() {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;
    if (isFormValid) {
      this.ref.close(this.fGroup.value);
    }
  }

  public onClose() {
    this.ref.close();
  }
  private setConfigMaps(): void {
    const { metadata } = new ReferPanelModel();
    this.configMap = metadata.configMap || {};
  }
}
