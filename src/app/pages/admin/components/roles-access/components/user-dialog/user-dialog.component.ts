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
  public isEditMode = false;
  private initialFormValues: any = null;

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
    this.roles = (this.optionsMap?.['roles'] as unknown as Option[]) || [];
    this.departments = (this.optionsMap?.['departments'] as unknown as Option[]) || [];

    this.roleAccessData = this.config.data;

    this.setConfigMaps();
    this.setOptions();

    if (this.config.header != 'Create User') {
      this.isEditMode = true;
      const updatedUser = this.replaceRoleAndDepartmentNamesWithCodes(
        this.roleAccessData,
      );
      this.fGroup.patchValue(updatedUser);
      this.fGroup.get('name')?.disable();
      this.fGroup.get('email')?.disable();
      this.fGroup.get('department')?.disable();
      this.initialFormValues = JSON.parse(JSON.stringify(this.fGroup.getRawValue()));
    }

    this.fGroup.updateValueAndValidity();
  }

  // Private
  private setConfigMaps(): void {
    const { metadata } = new UserRoleAccessDataModel();
    this.configMap = metadata.configMap || {};
  }

  public isFormChanged(): boolean {
    if (!this.isEditMode) return true;
    return JSON.stringify(this.fGroup.getRawValue()) !== JSON.stringify(this.initialFormValues);
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;
    if (isFormValid) {
      const result = { ...this.fGroup.getRawValue() };
      if (result.name) {
        result.name = result.name.trim();
      }
      if (result.email) {
        result.email = result.email.trim();
      }
      this.ref.close(result);
      // this.router.navigate(['/candidate']);
    }
  }

  public onClose() {
    this.ref.close();
  }

  public replaceRoleAndDepartmentNamesWithCodes(
    user: RolesAccess,
  ): RolesAccess {
    const updatedRoles = user.roles?.map((label: any) => {
      const cleanLabel =
        typeof label === 'string'
          ? label.trim().toLowerCase().replace(/[\s_]+/g, '')
          : String(label);

      const role = this.roles?.find((r: any) => {
        const cleanOptionLabel =
          typeof r.label === 'string'
            ? r.label.trim().toLowerCase().replace(/[\s_]+/g, '')
            : '';
        return (
          r.label === label ||
          (cleanLabel && cleanOptionLabel === cleanLabel) ||
          r.value === label ||
          String(r.value) === String(label)
        );
      });

      return role ? role.value : label;
    });

    const cleanDept =
      typeof user.department === 'string'
        ? user.department.trim().toLowerCase().replace(/[\s_]+/g, '')
        : '';
    const updatedDepartment = this.departments?.find(
      (r: any) =>
        r.label === user.department ||
        (cleanDept &&
          typeof r.label === 'string' &&
          r.label.trim().toLowerCase().replace(/[\s_]+/g, '') === cleanDept) ||
        r.value === user.department ||
        String(r.value) === String(user.department),
    )?.value ?? user.department;

    return {
      ...user,
      roles: updatedRoles,
      department: updatedDepartment,
    };
  }

  private setOptions() {
    (this.configMap['department'] as CustomSelectConfig).options = (this
      .optionsMap?.['departments'] as unknown as Option[]) || [];

    const userRole = this.storeService.getUserRole() || [];
    const isSuperAdmin = userRole.includes('superadmin');
    const allRoles = (this.optionsMap?.['roles'] as unknown as Option[]) || [];

    (this.configMap['roles'] as CustomSelectConfig).options = allRoles.filter((role) => {
      // Exclude Candidate ('5')
      if (String(role.value) === '5') {
        return false;
      }
      // If the current user is not a superadmin, also exclude Super Admin role ('2')
      if (
        !isSuperAdmin &&
        (String(role.value) === '2' ||
          role.label?.toLowerCase()?.replace(/[\s_]+/g, '') === 'superadmin')
      ) {
        // Retain the role if the user being edited already has it so the chip renders properly
        const userRoles = this.roleAccessData?.roles || [];
        const hasThisRole = userRoles.some((r: any) => {
          const clean =
            typeof r === 'string'
              ? r.trim().toLowerCase().replace(/[\s_]+/g, '')
              : String(r);
          return (
            clean === 'superadmin' ||
            clean === 'super_admin' ||
            r === '2' ||
            r === 2 ||
            r === role.value ||
            String(r) === String(role.value)
          );
        });
        if (!hasThisRole) {
          return false;
        }
      }
      return true;
    });
  }
}
