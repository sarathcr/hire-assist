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
        if (!isValidStartDate(dateTime)) {
          dateControl.setErrors({
            errorMessage: 'Schedule Date must be today or later.',
          });
        }
      }
    }
  }
}
