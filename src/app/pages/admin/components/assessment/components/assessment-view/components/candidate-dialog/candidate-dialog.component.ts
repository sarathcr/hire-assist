/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CandidateDataModel } from '../../../../../../models/candidate-data.model';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { Candidate } from '../../../../../../models/assessment-schedule.model';

@Component({
  selector: 'app-candidate-dialog',
  imports: [
    InputTextComponent,
    InputSelectComponent,
    ButtonComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './candidate-dialog.component.html',
  styleUrl: './candidate-dialog.component.scss',
})
export class CandidateDialogComponent implements OnInit {
  public candidateData: any;
  public fGroup!: FormGroup;
  public candidateDataModel = new CandidateDataModel();
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

  // LifeCycle Hooks
  ngOnInit(): void {
    this.fGroup = buildFormGroup(this.candidateDataModel);
    this.candidateData = this.config.data;
    this.fGroup.updateValueAndValidity();
    this.setConfigMaps();
    this.setOptions();
  }

  // Public Methods
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

  public onSubmit() {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;
    if (isFormValid) {
      this.ref.close(this.fGroup.value);
    }
  }

  // Private Methods
  private setConfigMaps(): void {
    const { metadata } = new CandidateDataModel();
    this.configMap = metadata.configMap || {};
  }

  private setOptions() {
    (this.configMap['batch'] as CustomSelectConfig).options =
      this.candidateData.batches.map((batch: any) => ({
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
