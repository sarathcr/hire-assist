import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from '../../../../components/base/base.component';
import { ButtonComponent } from '../../../../components/button/button.component';
import { InputTextComponent } from '../../../../components/form/input-text/input-text.component';
import { InputTextCalenderComponent } from '../../../../components/form/input-text-calender/input-text-calender.component';
import { InputSelectComponent } from '../../../../components/form/input-select/input-select.component';
import { BasicInformation, ProfileDetails } from '../../models/basic-information.model';
import { buildFormGroup, ConfigMap } from '../../../../utilities/form.utility';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-personal-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputTextComponent,
    InputTextCalenderComponent,
    InputSelectComponent,
  ],
  templateUrl: './personal-details-dialog.component.html',
  styleUrl: './personal-details-dialog.component.scss',
})
export class PersonalDetailsDialogComponent extends BaseComponent implements OnInit {
  public profileDetails!: ProfileDetails;
  public formGroup!: FormGroup;
  public configMap: ConfigMap;
  public basicInfoModel = new BasicInformation();

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {
    super();
    this.configMap = this.basicInfoModel.metadata.configMap!;
  }

  ngOnInit(): void {
    this.profileDetails = this.config.data.userDetails;
    this.initializeForm();
  }

  private initializeForm(): void {
    // We use buildFormGroup but override with current values
    this.formGroup = buildFormGroup(this.basicInfoModel);
    
    if (this.profileDetails) {
      this.formGroup.patchValue({
        email: this.profileDetails.email || '',
        phone: this.profileDetails.phoneNumber || '',
        dob: this.profileDetails.dob ? new Date(this.profileDetails.dob) : null,
        gender: this.profileDetails.gender || '',
      });
    }

    // Add specific validations if not already in model
    this.formGroup.get('email')?.setValidators([Validators.required, Validators.email]);
    this.formGroup.get('phone')?.setValidators([Validators.required]);
  }

  public onSubmit(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      this.ref.close(this.formGroup.value);
    }
  }

  public onClose(): void {
    this.ref.close();
  }
}
