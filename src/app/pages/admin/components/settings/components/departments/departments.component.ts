/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import {
  PaginatedData,
  PaginatedPayload,
} from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { StoreService } from '../../../../../../shared/services/store.service';
import {
  ConfigMap,
  buildFormGroup,
} from '../../../../../../shared/utilities/form.utility';

import { DepartmentForm } from '../../../../models/department-from.model';
import { Department } from '../../../../models/department.model';
import { DepartmentService } from '../../../../services/department.service';

import { DepartmentDialogComponent } from './components/department-dialog/department-dialog.component';
import { ASSESSMENT_URL } from '../../../../../../shared/constants/api';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { Toast } from 'primeng/toast';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Department',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'description',
      displayName: 'Description',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'active',
      displayName: 'Active',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'selectFilter',
      hasMultiStatus: false,
    },
    {
      field: 'actions',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      actions: [PaginatedDataActions.Edit, PaginatedDataActions.Delete],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: ['name', 'description', 'active', 'actions'],
};

@Component({
  selector: 'app-departments',
  imports: [TableComponent, Toast, ButtonComponent],
  providers: [TableDataSourceService],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.scss',
})
export class DepartmentsComponent implements OnInit, OnDestroy {
  public url = 'DepartmentSummary';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data!: PaginatedData<any>;
  public optionsMap = {};
  public columns: TableColumnsData = tableColumns;
  public item!: Department;
  public fGroup!: FormGroup;
  public departmentFormData = new DepartmentForm();
  public configMap!: ConfigMap;
  public isLoading = true;
  private currentPayload: PaginatedPayload = new PaginatedPayload();

  private ref: DynamicDialogRef | undefined;

  constructor(
    public dialog: DialogService,
    private departmentService: DepartmentService,
    public messageService: MessageService,
    private storeService: StoreService,
    private dataSourceService: TableDataSourceService<any>,
  ) {
    this.fGroup = buildFormGroup(this.departmentFormData);
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getAllPaginateddepartmentes(new PaginatedPayload());
    this.setConfigMaps();
  }
  ngOnDestroy(): void {
    if (this.ref) {
      this.ref.close();
    }
  }
  // Public Methods
  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.currentPayload = {
      ...payload,
      pagination: {
        ...payload.pagination,
        pageNumber: 1,
      },
    };
    this.loadData(payload);
  }

  public addNewDepartment() {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(DepartmentDialogComponent, {
      data: data,
      header: 'Create department',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      document.body.style.overflow = 'auto';
      if (res) {
        this.createDepartment(res);
      }
      this.fGroup.reset();
    });
  }

  public editDepartment(departmentData: Department) {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      formData: departmentData,
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(DepartmentDialogComponent, {
      data: data,
      header: 'Update department',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      document.body.style.overflow = 'auto';
      if (res) {
        this.updateDepartment(res);
      }
      this.fGroup.reset();
    });
  }

  public deleteDepartment(id: number) {
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the department?',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '25vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });

    this.ref.onClose.subscribe((result) => {
      document.body.style.overflow = 'auto';
      if (result) {
        this.deletedepartmentItem(id);
      }
      this.fGroup.reset();
    });
  }

  public getAllPaginateddepartmentes(payload: PaginatedPayload) {
    this.isLoading = true;
    const next = (res: any) => {
      if (res) {
        this.data = res;
      }
      this.isLoading = false;
    };

    const error = (error: CustomErrorResponse) => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error : ${error.error.type}`,
      });
    };

    this.departmentService
      .paginationEntity(`${this.url}`, payload)
      .subscribe({ next, error });
  }

  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService.getData(payload).subscribe((response: any) => {
      this.data = response;
    });
  }

  // Private Methods
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${ASSESSMENT_URL}/${this.url}`);
  }

  private setConfigMaps(): void {
    const { metadata } = new DepartmentForm();
    this.configMap = metadata.configMap || {};
  }

  private createDepartment(payload: Department) {
    this.isLoading = true;
    if (payload) {
      payload.isActive = true;
      payload.name = payload.name.trim();
    }

    const next = () => {
      this.storeService.setIsLoading(false);
      this.isLoading = false;
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Created department Successfully`,
        });
      }, 200);
      this.getAllPaginateddepartmentes(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      if (error?.status === 422 && error?.error?.businessError === 3106) {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `The Department is already exists.`,
        });
      } else {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Creation is failed`,
        });
      }
    };

    this.departmentService.addDepartment(payload).subscribe({ next, error });
  }

  private updateDepartment(payload: Department) {
    this.isLoading = true;
    payload.name = payload.name.trim();

    const next = () => {
      this.storeService.setIsLoading(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Updated the department Successfully',
      });

      this.getAllPaginateddepartmentes(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      this.isLoading = false;
      this.storeService.setIsLoading(false);
      if (error?.status === 422 && error?.error?.businessError === 3102) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `The Department is not exists.`,
        });
      } else if (
        error?.status === 422 &&
        error?.error?.businessError === 3106
      ) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `The Department is already exists.`,
        });
      } else if (
        error?.status === 422 &&
        error?.error?.businessError === 3112
      ) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'The updation is not possible. The department is already referenced by the user.',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Updation is failed',
        });
      }
    };
    this.departmentService.updateDepartment(payload).subscribe({ next, error });
  }

  private deletedepartmentItem(id: number) {
    this.isLoading = true;
    const next = () => {
      this.storeService.setIsLoading(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deleted the department Successfully',
      });
      this.getAllPaginateddepartmentes(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      this.storeService.setIsLoading(false);
      this.isLoading = false;
      if (error?.status === 422 && error?.error?.businessError === 3112) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'The deletion is not possible. The department is already referenced by the user.',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Deletion is failed',
        });
      }
    };
    this.departmentService.deleteDepartment(id).subscribe({ next, error });
  }
}
