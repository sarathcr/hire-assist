/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Toast } from 'primeng/toast';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { TableDataSourceService } from '../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { USER_URL } from '../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../shared/models/dialog.models';
import { PaginatedPayload } from '../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../shared/models/table.models';
import { StoreService } from '../../../../shared/services/store.service';
import { RolesAccess } from '../../models/roles-access.model';
import { UserService } from '../../services/user.service';
import { UserDialogComponent } from './components/user-dialog/user-dialog.component';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Name',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'roles',
      displayName: 'Role',
      sortedColumn: true,
      hasChip: true,
      hasTextFilter: true,
      filterAlias: 'textFilter',
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
  displayedColumns: [],
};
@Component({
  selector: 'app-roles-access',
  imports: [TableComponent, Toast, ButtonComponent],
  providers: [TableDataSourceService],
  templateUrl: './roles-access.component.html',
  styleUrl: './roles-access.component.scss',
})
export class RolesAccessComponent implements OnInit, OnDestroy {
  public data!: any;
  public columns: TableColumnsData = tableColumns;
  public selectedUsers: any = [];
  public isLoading = false;

  private ref: DynamicDialogRef | undefined;
  private currentPayload: PaginatedPayload = new PaginatedPayload();

  constructor(
    public dialog: DialogService,
    private userService: UserService,
    private dataSourceService: TableDataSourceService<any>,
    private messageService: MessageService,
    public storeService: StoreService,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getAllUsers(new PaginatedPayload());
  }
  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
  // Public Methods
  public AddNewUser() {
    this.ref = this.dialog.open(UserDialogComponent, {
      header: 'Create User',
      maximizable: false,
      width: '40vw',
      modal: true,
      styleClass: 'user__dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.ref.onClose.subscribe((result) => {
      if (result) {
        this.isLoading = true;
        // api call to create the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Created the User Successfully',
          });
          this.isLoading = false;
          this.getAllUsers(this.currentPayload);
        };
        const error = (error: CustomErrorResponse) => {
          this.isLoading = false;
          const businerssErrorCode = error.error.businessError;
          if (businerssErrorCode === 4002) {
            this.openActivateUserModal(error.error.errorValue);
          } else if (businerssErrorCode === 4001) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'User Already Exists',
            });
          } else if (businerssErrorCode === 5002) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'You are not allowed to create this user roles.',
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Creation failed',
            });
          }
        };

        this.userService.createEntity(result).subscribe({ next, error });
      }
    });
  }

  public editUser(userData: RolesAccess) {
    this.ref = this.dialog.open(UserDialogComponent, {
      data: userData,
      header: 'Update User',
      maximizable: false,
      width: '40vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((result) => {
      if (result) {
        this.isLoading = true;
        // api call to edit the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Updated the User Successfully',
          });
          this.getAllUsers(this.currentPayload);
          this.isLoading = false;
        };
        const error = (error: CustomErrorResponse) => {
          const businerssErrorCode = error.error.businessError;
          if (businerssErrorCode === 5002) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'You do not have permission to add this user role.',
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Updation is failed',
            });
          }

          this.isLoading = false;
        };
        this.userService.updateEntity('', result).subscribe({ next, error });
      }
    });
  }

  public deleteUser(userId: string) {
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the user?',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });
    this.ref.onClose.subscribe((result) => {
      if (result) {
        this.isLoading = true;
        // api call to delete the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the User Successfully',
          });
          this.getAllUsers(this.currentPayload);
          this.isLoading = false;
        };
        const error = () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Deletion is failed',
          });
          this.isLoading = false;
        };
        this.userService.deleteEntityById(userId).subscribe({ next, error });
      }
    });
  }

  public getSelectedItems(selectedUsersIds: RolesAccess[]) {
    this.selectedUsers = selectedUsersIds.map((item: RolesAccess) => item.id);
  }

  public deleteSelectedUsers() {
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the selected users?',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });

    this.ref.onClose.subscribe((result) => {
      if (result) {
        this.isLoading = true;
        // api call to delete the users
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the Selected Users Successfully',
          });
          this.getAllUsers(this.currentPayload);
          this.isLoading = false;
        };
        const error = () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Deletion is failed',
          });
          this.isLoading = false;
        };
        this.userService
          .updateEntity('', this.selectedUsers, 'deactivate')
          .subscribe({ next, error });
      }
    });
  }

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

  public getAllUsers(payload: PaginatedPayload) {
    this.isLoading = true;
    payload.filterMap = {
      excludedRoles: ['5'],
    };

    const next = (res: any) => {
      const formattedData = res.data.map((item: any) => ({
        ...item,
        roles: item.roles ? item.roles.split(',') : [],
      }));
      this.data = { ...res, data: formattedData };
      this.isLoading = false;
    };

    const error = () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load User list',
      });
      this.isLoading = false;
    };

    this.userService.paginationEntity('all', payload).subscribe({
      next,
      error,
    });
  }
  // Private Methods
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${USER_URL}/all`);
  }

  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService.getData(payload).subscribe((response: any) => {
      const formattedData = response.data.map((item: any) => ({
        ...item,
        roles: item.roles ? item.roles.split(',') : [],
      }));
      this.data = { ...response, data: formattedData };
    });
  }

  private openActivateUserModal(userId: string) {
    const modalData: DialogData = {
      message:
        'This user already exist but is not active. Do you want to activate the user.',
      isChoice: true,
      cancelButtonText: 'Close',
      acceptButtonText: 'Activate',
    };
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });
    this.ref.onClose.subscribe((res: boolean) => {
      if (res) {
        this.isLoading = true;
        // api call to activate the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Activated the User Successfully',
          });
          this.getAllUsers(this.currentPayload);
          this.isLoading = false;
        };
        const error = () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Activation of user is failed',
          });
          this.isLoading = false;
        };
        this.userService.updateEntity(userId).subscribe({ next, error });
      }
    });
  }
}
