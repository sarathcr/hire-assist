import { Component, OnDestroy, OnInit } from '@angular/core';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextCalenderComponent } from '../../../../../../../../shared/components/form/input-text-calender/input-text-calender.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { ToggleSwitchComponent } from '../../../../../../../../shared/components/form/toggle-switch/toggle-switch.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { BatchFormGroup } from '../../../../../../models/batch.model';
import { Metadata } from '../../../../../../../../shared/utilities/form.utility';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-batch-dialog',
  imports: [
    InputTextComponent,
    InputTextCalenderComponent,
    InputTextareaComponent,
    ToggleSwitchComponent,
    ButtonComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './batch-dialog.component.html',
  styleUrl: './batch-dialog.component.scss',
})
export class BatchDialogComponent implements OnInit, OnDestroy {
  public data!: BatchFormGroup;
  public metadata!: Metadata[];
  public showTime = true;
  public isEdit = false;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    this.data = this.config.data;
    this.isEdit = this.data.formData?.id ? true : false;

    if (this.isEdit) {
      const formData = this.data.formData;
      formData.id = this.data.formData.id;
      this.data.fGroup.patchValue({ ...formData });
      this.data.fGroup.get('startDate')?.setValue(new Date(formData.startDate));
      this.data.fGroup.get('endDate')?.setValue(new Date(formData.endDate));
    }
  }

  ngOnDestroy(): void {
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
}
