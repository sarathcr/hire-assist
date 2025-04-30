import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextCalenderComponent } from '../../../../../../../../shared/components/form/input-text-calender/input-text-calender.component';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../../../shared/utilities/form.utility';
import { ScheduleInterview } from '../../../../../../models/schedule-interview.model';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { Chip } from 'primeng/chip';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-interview',
  imports: [ReactiveFormsModule, InputTextCalenderComponent, ButtonComponent, CommonModule, Chip],
  templateUrl: './schedule-interview.component.html',
  styleUrl: './schedule-interview.component.scss',
})
export class ScheduleInterviewComponent implements OnInit {
  public fGroup!: FormGroup;
  public interviewModel = new ScheduleInterview();
  public configMap!: ConfigMap;
  public data!: string;
  selectedCandidateIds: string[] = [];


  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {
    this.fGroup = buildFormGroup(this.interviewModel);
  }

  // Life Cycle hooks
  ngOnInit(): void {
    this.data = this.config.data;
    this.setConfigMap();
    this.selectedCandidateIds = this.config.data || [];
    console.log("in dialogbox", this.data);
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
  removeCandidate(index: number): void {
    this.selectedCandidateIds.splice(index, 1);
  }
}
