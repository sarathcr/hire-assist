/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import { Candidate } from '../../../../../../models/assessment-schedule.model';
import { BatchFormGroup } from '../../../../../../models/batch.model';
import { CreateBatchDataModel } from '../../../../../../models/CreateBatchDataModel';
import { InputTextCalenderComponent } from '../../../../../../../../shared/components/form/input-text-calender/input-text-calender.component';
import { CandidateModel } from '../../../../../../models/candidate-data.model';
import { debounceTime } from 'rxjs';
import { isValidStartDate } from '../../../../../../../../shared/utilities/date.utility';

@Component({
  selector: 'app-create-batch-dialog',
  imports: [
    ButtonModule,
    ReactiveFormsModule,
    CommonModule,
    InputSelectComponent,
    ButtonComponent,
    InputMultiselectComponent,
    InputTextCalenderComponent,
  ],
  templateUrl: './create-batch-dialog.component.html',
  styleUrl: './create-batch-dialog.component.scss',
})
export class CreateBatchDialogComponent implements OnInit {
  public candidateData: any;
  public fGroup!: FormGroup;
  public candidateDataModel = new CreateBatchDataModel();
  public configMap!: ConfigMap;
  public optionsMap!: OptionsMap;
  public startDateChanged = false;
  public endDateChanged = false;
  public batches!: Option[];
  public questionSets!: Option[];
  private originalDates: Record<string, Date> = {};
  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  ngOnInit(): void {
    this.fGroup = buildFormGroup(this.candidateDataModel);
    this.candidateData = this.config.data;

    this.fGroup.updateValueAndValidity();
    this.setConfigMaps();
    this.setOptions();

    this.fGroup
      .get('batch')
      ?.valueChanges.pipe(debounceTime(0))
      .subscribe(() => {
        const { startDate, endDate } = this.extractSharedDateTimes();

        if (startDate) {
          this.originalDates['startDate'] = startDate;
          this.fGroup
            .get('startDate')
            ?.setValue(startDate, { emitEvent: false });
        } else {
          this.fGroup.get('startDate')?.reset({ emitEvent: false });
        }

        if (endDate) {
          this.originalDates['endDate'] = endDate;
          this.fGroup.get('endDate')?.setValue(endDate, { emitEvent: false });
        } else {
          this.fGroup.get('endDate')?.reset({ emitEvent: false });
        }
      });

    this.fGroup.get('startDate')?.valueChanges.subscribe((val) => {
      const original = this.originalDates['startDate'];
      this.startDateChanged = original
        ? new Date(original).getTime() !== new Date(val).getTime()
        : false;
      this.validateStartAndEndDates(this.fGroup, 'startDate', '');
    });

    this.fGroup.get('endDate')?.valueChanges.subscribe((val) => {
      const original = this.originalDates['endDate'];
      this.endDateChanged = original
        ? new Date(original).getTime() !== new Date(val).getTime()
        : false;
      this.validateStartAndEndDates(this.fGroup, '', 'endDate');
    });
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
  public isDateChanged(key: 'startDate' | 'endDate'): boolean {
    const original = this.originalDates[key];
    const current = this.fGroup.get(key)?.value;
    const result =
      original && current
        ? new Date(original).getTime() !== new Date(current).getTime()
        : false;
    if (result) {
      this.validateStartAndEndDates(this.fGroup, 'startDate', 'endDate');
    }
    return result;
  }
  private setOptions() {
    // Handle batches - could be PaginatedData object or array
    let batches: any[] = [];
    if (this.candidateData?.batches) {
      if (Array.isArray(this.candidateData.batches)) {
        batches = this.candidateData.batches;
      } else if (this.candidateData.batches.data && Array.isArray(this.candidateData.batches.data)) {
        // Handle PaginatedData object
        batches = this.candidateData.batches.data;
      }
    }

    // Handle questionSets - could be array or PaginatedData object
    let questionSets: any[] = [];
    if (this.candidateData?.questionSets) {
      if (Array.isArray(this.candidateData.questionSets)) {
        questionSets = this.candidateData.questionSets;
      } else if (this.candidateData.questionSets.data && Array.isArray(this.candidateData.questionSets.data)) {
        // Handle PaginatedData object
        questionSets = this.candidateData.questionSets.data;
      }
    }

    (this.configMap['batch'] as CustomSelectConfig).options = batches.map(
      (batch: BatchFormGroup) => ({
        label: batch.title,
        value: batch.id.toString(),
      }),
    );

    (this.configMap['questionSet'] as CustomSelectConfig).options =
      questionSets.map((batch: BatchFormGroup) => ({
        label: batch.title,
        value: batch.id.toString(),
      }));
  }

  private extractSharedDateTimes(): { startDate?: Date; endDate?: Date } {
    const selectedBatchId = this.fGroup?.get('batch')?.value;
    if (!selectedBatchId) return {};
    const data: CandidateModel[] =
      this.candidateData?.candidateData?.data || [];

    const batchCandidates = data.filter(
      (c) => String(c.batchId) === String(selectedBatchId),
    );
    const validDates = batchCandidates.filter(
      (c) =>
        c.startDateTime &&
        c.startDateTime !== '0001-01-01T00:00:00' &&
        c.endDateTime &&
        c.endDateTime !== '0001-01-01T00:00:00',
    );

    if (validDates.length === 0 && batchCandidates.length === 0) return {};

    const first = validDates[0];
    return {
      startDate: new Date(first.startDateTime!),
      endDate: new Date(first.endDateTime!),
    };
  }
  private validateStartAndEndDates(
    form: FormGroup,
    startDate?: string,
    endDate?: string,
  ): void {
    const startDateControl = startDate ? form.get(startDate) : null;
    const endDateControl = endDate ? form.get(endDate) : null;

    const startValue = startDateControl?.value;
    const endValue = endDateControl?.value;

    startDateControl?.setErrors(null);
    endDateControl?.setErrors(null);

    let hasStartError = false;
    let hasEndError = false;

    if (startDateControl) {
      if (!startValue) {
        startDateControl.setErrors({ required: true });
        hasStartError = true;
      } else {
        const startDateTime = new Date(startValue);
        if (!isValidStartDate(startDateTime)) {
          startDateControl.setErrors({
            errorMessage: 'Start date must be today or later.',
          });
          hasStartError = true;
        }
      }
    }

    if (endDateControl) {
      if (!endValue) {
        endDateControl.setErrors({ required: true });
        hasEndError = true;
      }
    }

    if (
      startDateControl &&
      endDateControl &&
      !hasStartError &&
      !hasEndError &&
      startValue &&
      endValue
    ) {
      const startDateTime = new Date(startValue);
      const endDateTime = new Date(endValue);

      const endDateValidation = this.isValidEndDates(
        startDateTime,
        endDateTime,
      );
      if (!endDateValidation.valid) {
        const error = 'End date must follow start date.';
        endDateControl.setErrors({ errorMessage: error });
      }
    }
  }
  private isValidEndDates = (
    startDate: Date,
    endDate: Date,
  ): { valid: boolean; error?: 'beforeStart' } => {
    if (endDate < startDate) {
      return { valid: false, error: 'beforeStart' };
    }

    return { valid: true };
  };
}
