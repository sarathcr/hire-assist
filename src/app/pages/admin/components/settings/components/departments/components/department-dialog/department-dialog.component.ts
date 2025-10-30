import { Component, OnDestroy, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Metadata } from '../../../../../../../../shared/utilities/form.utility';

import { NgClass } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { ToggleSwitchComponent } from '../../../../../../../../shared/components/form/toggle-switch/toggle-switch.component';
import { DepartmentFormGroup } from '../../../../../../models/department.model';

@Component({
  selector: 'app-department-dialog',
  imports: [
    InputTextComponent,
    InputTextareaComponent,
    ToggleSwitchComponent,
    ButtonComponent,
    ReactiveFormsModule,
    NgClass,
  ],
  templateUrl: './department-dialog.component.html',
  styleUrl: './department-dialog.component.scss',
})
export class DepartmentDialogComponent implements OnInit, OnDestroy {
  public data!: DepartmentFormGroup;
  public metadata!: Metadata[];
  public isEdit = false;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  // LifeCycle Hooks
  public ngOnInit(): void {
    this.data = this.config.data;
    this.isEdit = this.data.formData?.id ? true : false;
    if (this.isEdit) {
      const formData = this.data.formData;
      formData.id = this.data.formData.id;
      this.data.fGroup.patchValue({ ...formData });
    }
  }

  public ngOnDestroy(): void {
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
