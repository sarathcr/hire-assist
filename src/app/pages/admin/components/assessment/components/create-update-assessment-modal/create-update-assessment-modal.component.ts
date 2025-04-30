import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { InputTextCalenderComponent } from '../../../../../../shared/components/form/input-text-calender/input-text-calender.component';
import { InputTextComponent } from '../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { ToggleSwitchComponent } from '../../../../../../shared/components/form/toggle-switch/toggle-switch.component';
import { formatDate } from '../../../../../../shared/utilities/date.utility';
import { Metadata } from '../../../../../../shared/utilities/form.utility';
import { AssessmentFormGroup } from '../../../../models/assessment.model';

@Component({
  selector: 'app-create-update-assessment-modal',
  imports: [
    ReactiveFormsModule,
    InputTextComponent,
    ButtonComponent,
    InputTextareaComponent,
    InputTextCalenderComponent,
    ToggleSwitchComponent,
  ],
  templateUrl: './create-update-assessment-modal.component.html',
  styleUrl: './create-update-assessment-modal.component.scss',
})
export class CreateUpdateAssessmentModalComponent implements OnInit, OnDestroy {
  public data!: AssessmentFormGroup;
  public metadata!: Metadata[];
  public isEdit = false;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    this.getFormData();
  }

  ngOnDestroy(): void {
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
    this.data.fGroup.patchValue({ ...formData });
  }
}
