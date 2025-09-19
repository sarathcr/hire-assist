import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { InputSelectComponent } from '../../../../../../shared/components/form/input-select/input-select.component';
import { OptionsMap } from '../../../../../../shared/models/app-state.models';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../shared/utilities/form.utility';
import { AssignToBatchDataModel } from '../../../../models/AssignToBatchDataModel';

export interface Batch {
  id: string;
  name: string;
  scheduledTime: string;
}

@Component({
  selector: 'app-assign-batch-dialog',
  imports: [
    ButtonModule,
    ReactiveFormsModule,
    CommonModule,
    InputSelectComponent,
    ButtonComponent,
  ],
  templateUrl: './assign-batch-dialog.component.html',
  styleUrl: './assign-batch-dialog.component.scss',
})
export class AssignBatchDialogComponent implements OnInit {
  public batchList!: Batch[];
  public fGroup!: FormGroup;
  public candidateDataModel = new AssignToBatchDataModel();
  public configMap!: ConfigMap;
  public optionsMap!: OptionsMap;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  ngOnInit(): void {
    this.fGroup = buildFormGroup(this.candidateDataModel);
    this.batchList = this.config.data;

    this.fGroup.updateValueAndValidity();
    this.setConfigMaps();
    this.setOptions();
  }

  // Private
  private setConfigMaps(): void {
    const { metadata } = new AssignToBatchDataModel();
    this.configMap = metadata.configMap || {};
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

  private setOptions() {
    (this.configMap['batch'] as CustomSelectConfig).options =
      this.batchList.map((batch: Batch) => ({
        label: batch.name,
        value: batch.id,
      }));
  }
}
