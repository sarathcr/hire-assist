/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextComponent } from '../../../../../../shared/components/form/input-text/input-text.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../shared/utilities/form.utility';
import {
  RolesAccess,
  UserRoleAccessDataModel,
} from '../../../../models/roles-access.model';
import { OptionsMap } from '../../../../../../shared/models/app-state.models';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { StoreService } from '../../../../../../shared/services/store.service';
import { Option } from '../../../../../../shared/models/option';
import { InputMultiselectComponent } from '../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { InputSelectComponent } from '../../../../../../shared/components/form/input-select/input-select.component';

@Component({
  selector: 'app-user-dialog',
  imports: [
    ButtonModule,
    InputTextComponent,
    InputMultiselectComponent,
    InputSelectComponent,
    ReactiveFormsModule,
    CommonModule,
    ButtonComponent,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss',
})
export class UserDialogComponent implements OnInit {
  public roleAccessData: any;
  public fGroup!: FormGroup;
  public userRoleAccessData = new UserRoleAccessDataModel();
  public configMap!: ConfigMap;
  public optionsMap!: OptionsMap;

  public departments!: Option[];

  public roles!: Option[];

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private storeService: StoreService,
  ) {
    this.fGroup = buildFormGroup(this.userRoleAccessData);
  }

  ngOnInit(): void {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.roles = this.optionsMap['roles'] as unknown as Option[];
    this.departments = this.optionsMap['departments'] as unknown as Option[];

    this.roleAccessData = this.config.data;

    if (this.config.header != 'Create User') {
      const updatedUser = this.replaceRoleAndDepartmentNamesWithCodes(
        this.roleAccessData,
      );
      this.fGroup.patchValue(updatedUser);
    }

    this.fGroup.updateValueAndValidity();
    this.setConfigMaps();
    this.setOptions();
  }

  // Private
  private setConfigMaps(): void {
    const { metadata } = new UserRoleAccessDataModel();
    this.configMap = metadata.configMap || {};
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;
    if (isFormValid) {
      this.ref.close(this.fGroup.value);
      // this.router.navigate(['/candidate']);
    }
  }

  public onClose() {
    this.ref.close();
  }

  public replaceRoleAndDepartmentNamesWithCodes(
    user: RolesAccess,
  ): RolesAccess {
    const updatedRoles = user.roles?.map((label) => {
      const role = this.roles?.find((r) => r.label === label);
      return role ? role.value : label;
    });

    const updatedDepartment = this.departments?.find(
      (r) => r.label === user.department,
    )?.value;

    return {
      ...user,
      roles: updatedRoles,
      department: updatedDepartment,
    };
  }

  private setOptions() {
    (this.configMap['department'] as CustomSelectConfig).options =
      this.optionsMap['departments'];

    (this.configMap['roles'] as CustomSelectConfig).options =
      this.optionsMap['roles'];
  }
}
