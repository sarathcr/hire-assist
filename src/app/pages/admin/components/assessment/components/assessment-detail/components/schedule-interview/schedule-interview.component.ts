import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chip } from 'primeng/chip';
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

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {
    super();
    this.fGroup = buildFormGroup(this.interviewModel);
  }

  // Life Cycle hooks
  ngOnInit(): void {
    this.data = this.config.data;
    this.setConfigMap();
    this.selectedCandidateIds = this.config.data || [];
    this.setupDateValidation();
  }

  // Public methods
  public onClose() {
    this.ref.close();
  }
  public onSchedule() {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;

    if (isFormValid) {
      this.ref.close(this.fGroup.value);
    }
  }

  // Private Methods
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
        if (newValue && !isValidStartDate(newValue)) {
          scheduleDateControl?.setErrors({
            errorMessage: 'Schedule Date must be today or later.',
          });
        } else {
          scheduleDateControl?.setErrors(null);
        }
      },
    );
    if (sub) {
      this.subscriptionList.push(sub);
    }
  }
}
