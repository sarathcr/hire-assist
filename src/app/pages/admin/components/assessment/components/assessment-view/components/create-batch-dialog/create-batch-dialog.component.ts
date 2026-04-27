/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
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
import { validateStartAndEndDates } from '../../../../../../../../shared/utilities/date.utility';

@Component({
  selector: 'app-create-batch-dialog',
  imports: [
    ButtonModule,
    ReactiveFormsModule,
    CommonModule,
    InputSelectComponent,
    ButtonComponent,
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
  public batches!: Option[];
  public questionSets!: Option[];
  private originalDates: Record<string, Date> = {};
  public minDate: Date = new Date();

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

    // Set minDate for startDate and endDate configs
    if (this.configMap['startDate']) {
      (this.configMap['startDate'] as any).minDate = this.minDate;
    }
    if (this.configMap['endDate']) {
      (this.configMap['endDate'] as any).minDate = this.minDate;
    }

    this.fGroup
      .get('batch')
      ?.valueChanges.pipe(debounceTime(0))
      .subscribe(() => {
        const { startDate, endDate } = this.extractSharedDateTimes();
        this.fGroup.get('startDate')?.setValue(startDate || null, { emitEvent: false });
        this.fGroup.get('endDate')?.setValue(endDate || null, { emitEvent: false });

        if (startDate) {
          this.originalDates['startDate'] = startDate;
        }
        if (endDate) {
          this.originalDates['endDate'] = endDate;
        }

        validateStartAndEndDates(this.fGroup, 'startDate', 'endDate');
      });

    this.fGroup.get('startDate')?.valueChanges.subscribe((value) => {
      if (value) {
        this.ensureOneHourDifference();
      }
      validateStartAndEndDates(this.fGroup, 'startDate', 'endDate');
    });

    this.fGroup.get('endDate')?.valueChanges.subscribe(() => {
      validateStartAndEndDates(this.fGroup, 'startDate', 'endDate');
    });
  }

  private setConfigMaps(): void {
    const { metadata } = new CreateBatchDataModel();
    this.configMap = metadata.configMap || {};
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();
    validateStartAndEndDates(this.fGroup, 'startDate', 'endDate');

    const isFormValid = this.fGroup.valid;
    if (isFormValid) {
      this.ref.close(this.fGroup.value);
    }
    // Show error if startDate is before now
    const startValue = this.fGroup.get('startDate')?.value;
    if (startValue && new Date(startValue) < new Date()) {
      this.fGroup
        .get('startDate')
        ?.setErrors({ errorMessage: 'Start date/time cannot be in the past.' });
    }
    const endValue = this.fGroup.get('endDate')?.value;
    if (endValue && new Date(endValue) < new Date()) {
      this.fGroup
        .get('endDate')
        ?.setErrors({ errorMessage: 'End date/time cannot be in the past.' });
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

    const originalDate = original ? new Date(original) : null;
    const currentDate = current ? new Date(current) : null;

    return originalDate &&
      currentDate &&
      !isNaN(originalDate.getTime()) &&
      !isNaN(currentDate.getTime())
      ? originalDate.getTime() !== currentDate.getTime()
      : false;
  }

  private setOptions() {
    let batches: any[] = [];
    if (this.candidateData?.batches) {
      if (Array.isArray(this.candidateData.batches)) {
        batches = this.candidateData.batches;
      } else if (
        this.candidateData.batches.data &&
        Array.isArray(this.candidateData.batches.data)
      ) {
        batches = this.candidateData.batches.data;
      }
    }

    let questionSets: any[] = [];
    if (this.candidateData?.questionSets) {
      if (Array.isArray(this.candidateData.questionSets)) {
        questionSets = this.candidateData.questionSets;
      } else if (
        this.candidateData.questionSets.data &&
        Array.isArray(this.candidateData.questionSets.data)
      ) {
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
        !c.startDateTime.startsWith('0001-01-01') &&
        c.endDateTime &&
        c.endDateTime !== '0001-01-01T00:00:00' &&
        !c.endDateTime.startsWith('0001-01-01'),
    );

    if (validDates.length === 0) {
      // Default to current time if no valid dates found in the batch
      const now = new Date();
      return {
        startDate: now,
        endDate: new Date(now.getTime() + 3600000), // 1 hour later
      };
    }

    const first = validDates[0];
    const startDate = new Date(first.startDateTime!);
    let endDate = new Date(first.endDateTime!);

    // Ensure 1-hour difference even for pre-filled data
    if (endDate.getTime() - startDate.getTime() < 3600000) {
      endDate = new Date(startDate.getTime() + 3600000);
    }

    return {
      startDate,
      endDate,
    };
  }

  /**
   * Adjusts the endDate to be at least one hour after the current startDate
   * if the current endDate is missing or doesn't meet the requirement.
   */
  private ensureOneHourDifference(): void {
    const startDateValue = this.fGroup.get('startDate')?.value;
    if (!startDateValue) return;

    const startDate = new Date(startDateValue);
    if (isNaN(startDate.getTime())) return;

    const endDateControl = this.fGroup.get('endDate');
    const endDateValue = endDateControl?.value;

    // Use a Date object if possible for comparison
    const endDateObj = endDateValue ? new Date(endDateValue) : null;

    if (
      !endDateObj ||
      isNaN(endDateObj.getTime()) ||
      endDateObj.getTime() - startDate.getTime() < 3600000
    ) {
      const newEndDate = new Date(startDate.getTime() + 3600000);
      endDateControl?.setValue(newEndDate, { emitEvent: false });
    }
  }
}
