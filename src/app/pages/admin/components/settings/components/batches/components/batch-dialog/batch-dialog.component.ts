import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { ToggleSwitchComponent } from '../../../../../../../../shared/components/form/toggle-switch/toggle-switch.component';
import { validateStartAndEndDates } from '../../../../../../../../shared/utilities/date.utility';
import { Metadata } from '../../../../../../../../shared/utilities/form.utility';
import { BatchFormGroup } from '../../../../../../models/batch.model';

@Component({
  selector: 'app-batch-dialog',
  imports: [
    InputTextComponent,
    InputTextareaComponent,
    ToggleSwitchComponent,
    ButtonComponent,
    ReactiveFormsModule,
    NgClass,
  ],
  templateUrl: './batch-dialog.component.html',
  styleUrl: './batch-dialog.component.scss',
})
export class BatchDialogComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  public data!: BatchFormGroup;
  public metadata!: Metadata[];
  public showTime = true;
  public isEdit = false;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {
    super();
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.data = this.config.data;
    this.isEdit = this.data.formData?.id ? true : false;
    this.setupDateValidation();
    if (this.isEdit) {
      const formData = this.data.formData;
      formData.id = this.data.formData.id;
      this.data.fGroup.patchValue({ ...formData });
    }
  }

  override ngOnDestroy(): void {
    this.data.fGroup.reset();
  }

  // Public Methods
  public onSubmit() {
    this.data.fGroup.markAllAsTouched();
    if (this.isEdit && this.ref) {
      this.ref.close({ ...this.data.fGroup.value, id: this.data.formData.id });
    } else {
      this.ref.close(this.data.fGroup.value);
    }
  }

  public onClose() {
    this.ref.close();
  }

  //private Methods
  private setupDateValidation(): void {
    const startDate = 'startDate';
    const endDate = 'endDate';

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
