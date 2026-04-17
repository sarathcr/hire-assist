import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chip } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputTextCalenderComponent } from '../../../../../../../../shared/components/form/input-text-calender/input-text-calender.component';
import { isValidStartDate } from '../../../../../../../../shared/utilities/date.utility';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../../../shared/utilities/form.utility';
import { ScheduleInterview } from '../../../../../../models/schedule-interview.model';

@Component({
  selector: 'app-schedule-interview',
  imports: [
    ReactiveFormsModule,
    InputTextCalenderComponent,
    ButtonComponent,
    CommonModule,
    Chip,
    SkeletonModule,
  ],
  templateUrl: './schedule-interview.component.html',
  styleUrl: './schedule-interview.component.scss',
})
export class ScheduleInterviewComponent
  extends BaseComponent
  implements OnInit
{
  public fGroup!: FormGroup;
  public interviewModel = new ScheduleInterview();
  public configMap!: ConfigMap;
  public data!: string;
  public selectedCandidateIds: string[] = [];
  public isLoading = false;
  public isLoadingPanelData = false;
  public isPanelValidationError = false;
  public minDate!: Date;
  public maxDate!: Date;
  public validationMinDate!: Date;
  public onSubmitCallback?: (formValue: { scheduleDate: Date }) => void;
  public setComponentInstance?: (instance: ScheduleInterviewComponent) => void;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {
    super();
    this.fGroup = buildFormGroup(this.interviewModel);
  }

  ngOnInit(): void {
    this.data = this.config.data?.candidateIds || this.config.data;
    this.setConfigMap();
    this.selectedCandidateIds =
      this.config.data?.candidateIds || this.config.data || [];
    this.onSubmitCallback = this.config.data?.onSubmit;
    this.setComponentInstance = this.config.data?.setComponentInstance;
    this.isLoadingPanelData = this.config.data?.isLoadingPanelData || false;

    // Set min and max dates from recruitment range
    if (this.config.data?.startDateTime) {
      this.minDate = new Date(this.config.data.startDateTime);
    }
    if (this.config.data?.endDateTime) {
      this.maxDate = new Date(this.config.data.endDateTime);
      // Ensure maxDate covers the entire day to avoid restricting times on the final day
      this.maxDate.setHours(23, 59, 59, 999);
    }

    // Capture precise current time for validation
    const now = new Date();
    this.validationMinDate = new Date(now);
    this.validationMinDate.setSeconds(0, 0);
    this.validationMinDate.setMilliseconds(0);

    // Normalize minDate time to 00:00:00 for the UI picker.
    // This resolves a PrimeNG bug where the minDate's time component 
    // restricts available times even on future dates.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (!this.minDate || this.minDate < startOfToday) {
      this.minDate = startOfToday;
    } else {
      // If minDate is in the future, we still normalize its time to 00:00:00
      // so the user can select any time on that start date in the UI,
      // and our custom validation will handle the precise time check.
      const normalizedFutureDate = new Date(this.minDate);
      normalizedFutureDate.setHours(0, 0, 0, 0);
      this.minDate = normalizedFutureDate;
    }

    if (this.setComponentInstance) {
      this.setComponentInstance(this);
    }

    this.fGroup.get('scheduleDate')?.valueChanges.subscribe(() => {
      this.validateScheduleDate(this.fGroup, 'scheduleDate');
    });
  }

  public onClose() {
    if (!this.isLoading) {
      this.ref.close();
    }
  }

  public onSchedule() {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;

    if (
      isFormValid &&
      !this.isLoading &&
      !this.isLoadingPanelData &&
      !this.isPanelValidationError &&
      this.onSubmitCallback
    ) {
      this.isLoading = true;
      this.onSubmitCallback(this.fGroup.value);
    }
  }

  public closeOnSuccess() {
    this.isLoading = false;
    this.ref.close(this.fGroup.value);
  }

  public handleError() {
    this.isLoading = false;
  }

  public handlePanelValidationSuccess() {
    this.isLoadingPanelData = false;
    this.isPanelValidationError = false;
    // Enable the form control
    const scheduleDateControl = this.fGroup.get('scheduleDate');
    if (scheduleDateControl) {
      scheduleDateControl.enable();
    }
  }

  public handlePanelValidationError() {
    this.isLoadingPanelData = false;
    this.isPanelValidationError = true;
    // Disable the form control
    const scheduleDateControl = this.fGroup.get('scheduleDate');
    if (scheduleDateControl) {
      scheduleDateControl.disable();
    }
  }

  private setConfigMap() {
    const { metadata } = new ScheduleInterview();
    this.configMap = metadata.configMap || {};
  }

  public removeCandidate(index: number): void {
    this.selectedCandidateIds.splice(index, 1);
  }

  private validateScheduleDate(form: FormGroup, dateField: string): void {
    const dateControl = form.get(dateField);
    const dateValue = dateControl?.value;

    dateControl?.setErrors(null);

    if (dateControl) {
      if (!dateValue) {
        dateControl.setErrors({ required: true });
      } else {
        const dateTime = new Date(dateValue);

        if (this.validationMinDate && dateTime < this.validationMinDate) {
          dateControl.setErrors({
            errorMessage: `Schedule Date & Time cannot be in the past.`,
          });
        } else if (this.maxDate && dateTime > this.maxDate) {
          dateControl.setErrors({
            errorMessage: `Schedule Date must be on or before ${this.maxDate.toLocaleDateString()}.`,
          });
        }
      }
    }
  }
}
