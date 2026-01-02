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
    this.selectedCandidateIds = this.config.data?.candidateIds || this.config.data || [];
    this.onSubmitCallback = this.config.data?.onSubmit;
    this.setComponentInstance = this.config.data?.setComponentInstance;
    this.isLoadingPanelData = this.config.data?.isLoadingPanelData || false;
    
    // Register this component instance with parent
    if (this.setComponentInstance) {
      this.setComponentInstance(this);
    }
    
    this.setupDateValidation();
  }

  public onClose() {
    if (!this.isLoading) {
      this.ref.close();
    }
  }

  public onSchedule() {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;

    if (isFormValid && !this.isLoading && !this.isLoadingPanelData && !this.isPanelValidationError && this.onSubmitCallback) {
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
  private setupDateValidation(): void {
    const scheduleDateControl = this.fGroup.get('scheduleDate');

    const sub = scheduleDateControl?.valueChanges.subscribe(
      (newValue: Date) => {
        setTimeout(() => {
          if (newValue && !isValidStartDate(newValue)) {
            scheduleDateControl?.setErrors({
              errorMessage: 'Schedule Date must be today or later.',
            });
          } else {
            const currentErrors = scheduleDateControl?.errors;
            if (currentErrors && currentErrors['errorMessage']) {
              scheduleDateControl?.setErrors(null, { emitEvent: false });
            }
          }
        }, 0);
      },
    );
    if (sub) {
      this.subscriptionList.push(sub);
    }
  }
}
