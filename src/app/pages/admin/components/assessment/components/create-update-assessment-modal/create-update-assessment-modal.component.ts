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
  private initialFormValues: any;

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

  public get hasChanges(): boolean {
    if (!this.isEdit) return true;
    if (!this.initialFormValues) return false;

    const current = this.data.fGroup.getRawValue();

    const normalize = (val: any) => typeof val === 'string' ? val.trim().replace(/\s+/g, ' ') : val;

    const currentName = normalize(current.name);
    const initialName = normalize(this.initialFormValues.name);

    const currentDesc = normalize(current.description);
    const initialDesc = normalize(this.initialFormValues.description);

    const currentStart = current.startDateTime ? formatDate(current.startDateTime.toString()) : '';
    const currentEnd = current.endDateTime ? formatDate(current.endDateTime.toString()) : '';

    return (
      currentName !== initialName ||
      currentDesc !== initialDesc ||
      current.isActive !== this.initialFormValues.isActive ||
      currentStart !== this.initialFormValues.startDateTime ||
      currentEnd !== this.initialFormValues.endDateTime
    );
  }

  public onSubmit() {
    this.data.fGroup.markAllAsTouched();
    this.data.fGroup.updateValueAndValidity();
    if (this.data.fGroup.invalid) {
      return;
    }

    if (this.isEdit && !this.hasChanges) {
      this.ref?.close();
      return;
    }

    if (this.isEdit && this.ref) {
      this.ref?.close({ ...this.data.fGroup.getRawValue(), id: this.data.formData.id });
    } else {
      this.ref?.close(this.data.fGroup.getRawValue());
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
      this.initialFormValues = {
        name: this.data.formData.name,
        description: this.data.formData.description,
        isActive: this.data.formData.isActive,
        startDateTime: formatDate(this.data.formData.startDateTime?.toString() || ''),
        endDateTime: formatDate(this.data.formData.endDateTime?.toString() || '')
      };
      this.validateCreateOrUpdateAssessment(id);
    }
  }

  private validateCreateOrUpdateAssessment(id: number): void {
    this.isEdit = id ? true : false;
    if (this.isEdit) this.setFormData();
  }

  private setFormData(): void {
    const startFormatted = formatDate(
      this.data.formData.startDateTime?.toString() || ''
    );
    const endFormatted = formatDate(
      this.data.formData.endDateTime?.toString() || ''
    );
    
    this.data.fGroup.patchValue({
      ...this.data.formData,
      startDateTime: this.parseDDMMYYYY(startFormatted) as any,
      endDateTime: this.parseDDMMYYYY(endFormatted) as any,
    });
    
    const activeRoundsPercentage = this.data.formData.activeRoundsPercentage ?? 0;
    const isProgress100 = activeRoundsPercentage === 100;
    const isInProgress = activeRoundsPercentage > 0;

    const startDateObj = this.parseDDMMYYYY(startFormatted);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDateObj) {
      startDateObj.setHours(0, 0, 0, 0);
    }
    const isStarted = startDateObj ? startDateObj < today : false;

    if (isProgress100) {
      this.data.fGroup.get('name')?.disable();
      this.data.fGroup.get('description')?.disable();
      this.data.fGroup.get('startDateTime')?.disable();
      this.data.fGroup.get('endDateTime')?.disable();
    } else if (isInProgress) {
      this.data.fGroup.get('name')?.disable();
      this.data.fGroup.get('description')?.disable();
      this.data.fGroup.get('startDateTime')?.disable();
      // Keep endDateTime enabled so they can extend or shorten the recruitment
    } else if (isStarted) {
      this.data.fGroup.get('startDateTime')?.disable();
    }
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
