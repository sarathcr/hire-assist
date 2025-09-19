import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { ToggleSwitchComponent } from '../../../../../../../../shared/components/form/toggle-switch/toggle-switch.component';
import { Metadata } from '../../../../../../../../shared/utilities/form.utility';
import { PanelFormGroup } from '../../../../../../models/panel.model';

@Component({
  selector: 'app-panel-dialog',
  imports: [
    InputTextComponent,
    InputTextareaComponent,
    ToggleSwitchComponent,
    ButtonComponent,
    ReactiveFormsModule,
    NgClass,
  ],
  templateUrl: './panel-dialog.component.html',
  styleUrl: './panel-dialog.component.scss',
})
export class PanelDialogComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  public data!: PanelFormGroup;
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
    this.data = this.config.data;
    this.isEdit = this.data.formData?.id ? true : false;
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
}
