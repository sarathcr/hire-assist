/* eslint-disable @typescript-eslint/no-explicit-any */
import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { InputTextCalenderComponent } from '../../../../../../shared/components/form/input-text-calender/input-text-calender.component';
import { InputTextComponent } from '../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { ToggleSwitchComponent } from '../../../../../../shared/components/form/toggle-switch/toggle-switch.component';
import {
  formatDate,
  validateStartAndEndDates,
} from '../../../../../../shared/utilities/date.utility';
import { Metadata } from '../../../../../../shared/utilities/form.utility';
import { AssessmentFormGroup } from '../../../../models/assessment.model';
import { BaseComponent } from '../../../../../../shared/components/base/base.component';

@Component({
  selector: 'app-create-update-assessment-modal',
  imports: [
    ReactiveFormsModule,
    InputTextComponent,
    ButtonComponent,
    InputTextareaComponent,
    InputTextCalenderComponent,
    ToggleSwitchComponent,
    NgClass,
  ],
  templateUrl: './create-update-assessment-modal.component.html',
  styleUrl: './create-update-assessment-modal.component.scss',
})
export class CreateUpdateAssessmentModalComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  public data!: AssessmentFormGroup;
  public metadata!: Metadata[];
  public isEdit = false;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {
    super();
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.getFormData();
    this.setupDateValidation();
    this.isEdit = this.data.formData?.id ? true : false;
  }

  override ngOnDestroy(): void {
    this.data.fGroup.reset();
  }

  // Public Methods

  public onSubmit() {
    this.data.fGroup.markAllAsTouched();
    this.data.fGroup.updateValueAndValidity();
    if (this.data.fGroup.invalid) {
      return;
    }

    if (this.isEdit && this.ref) {
      this.ref?.close({ ...this.data.fGroup.value, id: this.data.formData.id });
    } else {
      this.ref?.close(this.data.fGroup.value);
    }
  }
  public onClose() {
    this.ref.close();
  }

  // Private Methods
  private getFormData(): void {
    this.data = this.config.data;
    const id = this.data.formData?.id;
    if (id !== undefined) {
      this.validateCreateOrUpdateAssessment(id);
    }
  }

  private validateCreateOrUpdateAssessment(id: number): void {
    this.isEdit = id ? true : false;
    if (this.isEdit) this.setFormData();
  }

  private setFormData(): void {
    const formData = this.data.formData;
    formData.id = this.data.formData.id;
    formData.startDateTime = formatDate(
      this.data.formData.startDateTime.toString(),
    );
    formData.endDateTime = formatDate(
      this.data.formData.endDateTime.toString(),
    );
    const startFormatted = formatDate(
      this.data.formData.startDateTime.toString(),
    );
    const endFormatted = formatDate(this.data.formData.endDateTime.toString());
    this.data.fGroup.patchValue({
      ...formData,
      startDateTime: this.parseDDMMYYYY(startFormatted) as any,
      endDateTime: this.parseDDMMYYYY(endFormatted) as any,
    });
  }
  private parseDDMMYYYY(dateStr: string): Date | null {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private setupDateValidation(): void {
    const startDate = 'startDateTime';
    const endDate = 'endDateTime';

    const startDateSub = this.data.fGroup
      .get(startDate)
      ?.valueChanges.subscribe(() => {
        validateStartAndEndDates(this.data.fGroup, startDate, endDate);
      });
    if (startDateSub) {
      this.subscriptionList.push(startDateSub);
    }

    const endDateSub = this.data.fGroup
      .get(endDate)
      ?.valueChanges.subscribe(() => {
        validateStartAndEndDates(this.data.fGroup, startDate, endDate);
      });
    if (endDateSub) {
      this.subscriptionList.push(endDateSub);
    }
  }
}
