import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import {
  ConfigMap,
  buildFormGroup,
} from '../../../../../../../../../../shared/utilities/form.utility';
import { AssessmentScheduleModal } from '../../../../../../../../models/assessment-schedule.model';

@Component({
  selector: 'app-create-round-modal',
  imports: [
    InputTextComponent,
    InputTextareaComponent,
    ButtonComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './create-round-modal.component.html',
  styleUrl: './create-round-modal.component.scss',
})
export class CreateRoundModalComponent implements OnInit {
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;
  public roundModel = new AssessmentScheduleModal();

  constructor(
    private readonly ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {
    this.fGroup = buildFormGroup(this.roundModel);
  }

  ngOnInit(): void {
    this.setConfigMaps();

    // Remove required validator from round field (not used in this modal)
    const roundControl = this.fGroup.get('round');
    if (roundControl) {
      roundControl.clearValidators();
      roundControl.updateValueAndValidity();
    }

    // Remove required validator from id field (not needed for creation)
    const idControl = this.fGroup.get('id');
    if (idControl) {
      idControl.clearValidators();
      idControl.updateValueAndValidity();
    }

    // Add required validator for name field
    const nameControl = this.fGroup.get('name');
    if (nameControl) {
      nameControl.setValidators([Validators.required]);
      nameControl.updateValueAndValidity();
    }
  }

  public onSubmit(): void {
    this.fGroup.markAllAsTouched();

    // Ensure form values are updated
    this.fGroup.updateValueAndValidity();

    if (this.fGroup.valid) {
      const formValue = this.fGroup.getRawValue();
      const payload: { id: string; name: string; description: string } = {
        id: '',
        name: formValue.name || '',
        description: formValue.description || '',
      };

      // Close dialog with payload
      this.ref.close(payload);
    }
  }

  public onClose(): void {
    this.ref.close();
  }

  private setConfigMaps(): void {
    const { metadata } = new AssessmentScheduleModal();
    this.configMap = metadata.configMap || {};
  }
}
