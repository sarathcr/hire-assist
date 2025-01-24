import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputSelectComponent } from '../../../../shared/components/form/input-select/input-select.component';
import { InputTextAreaComponent } from '../../../../shared/components/form/input-text-area/input-text-area.component';
import { ToggleSwitchComponent } from '../../../../shared/components/form/toggle-switch/toggle-switch.component';
import { InputTextComponent } from '../../../../shared/components/form/Input-Text-Components/input-text/input-text.component';
import { InputTextCalenderComponent } from '../../../../shared/components/form/Input-Text-Components/input-text-calender/input-text-calender.component';

@Component({
  selector: 'app-create',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    // InputSelectComponent,
    InputTextComponent,
    InputTextAreaComponent,
    ButtonComponent,
    ToggleSwitchComponent,
    InputTextCalenderComponent,
  ],
  templateUrl: './assessment-form-modal.component.html',
  styleUrl: './assessment-form-modal.component.scss',
  standalone: true,
})
export class AssessmentFormModal {
  // public btnSubmit = output();
  public data: any;
  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    this.data = this.config.data;
  }

  public onSubmit() {
    this.ref.close(this.data.fGroup.value);
  }
  public onClose() {
    this.ref.close();
  }
}
