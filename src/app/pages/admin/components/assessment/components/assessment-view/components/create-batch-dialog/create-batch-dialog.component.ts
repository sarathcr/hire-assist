/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import { Candidate } from '../../../../../../models/assessment-schedule.model';
import { CreateBatchDataModel } from '../../../../../../models/CreateBatchDataModel';
import { AssessmentService } from '../../../../../../services/assessment.service';

@Component({
  selector: 'app-create-batch-dialog',
  imports: [
    ButtonModule,
    ReactiveFormsModule,
    CommonModule,
    InputSelectComponent,
    ButtonComponent,
    InputMultiselectComponent,
  ],
  templateUrl: './create-batch-dialog.component.html',
  styleUrl: './create-batch-dialog.component.scss',
})
export class CreateBatchDialogComponent implements OnInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public candidateData: any;
  public fGroup!: FormGroup;
  public candidateDataModel = new CreateBatchDataModel();
  public configMap!: ConfigMap;
  public optionsMap!: OptionsMap;

  public batches!: Option[];
  public questionSets!: Option[];

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private storeService: StoreService,
    private assessmentService: AssessmentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.fGroup = buildFormGroup(this.candidateDataModel);
    this.candidateData = this.config.data;

    // if (this.config.header != 'Create Candidate') {
    //   const updatedUser = this.replaceNamesWithCodes(
    //     this.candidateData
    //   );
    //   this.fGroup.patchValue(updatedUser);
    // }

    this.fGroup.updateValueAndValidity();
    this.setConfigMaps();
    this.setOptions();
  }

  // Private
  private setConfigMaps(): void {
    const { metadata } = new CreateBatchDataModel();
    this.configMap = metadata.configMap || {};
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;
    if (isFormValid) {
      this.ref.close(this.fGroup.value);
      // this.router.navigate(['/candidate']);
    }
  }

  public onClose() {
    this.ref.close();
  }

  public replaceNamesWithCodes(user: Candidate): Candidate {
    const updatedBatch = this.batches.find(
      (r) => r.label === user.batch,
    )?.value;

    const updatedQuestionSet = this.questionSets.find(
      (r) => r.label === user.questionSet,
    )?.value;

    return {
      ...user,
      batch: updatedBatch,
      questionSet: updatedQuestionSet,
    };
  }

  private setOptions() {
    (this.configMap['batch'] as CustomSelectConfig).options =
      this.candidateData?.batches?.map((batch: any) => ({
        label: batch.title,
        value: batch.id.toString(),
      }));

    (this.configMap['questionSet'] as CustomSelectConfig).options =
      this.candidateData.questionSets.map((batch: any) => ({
        label: batch.title,
        value: batch.id.toString(),
      }));
  }
}
