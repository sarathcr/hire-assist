/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Toast } from 'primeng/toast';
import { TableDataSourceService } from '../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { USER_URL } from '../../../../shared/constants/api';
import { PaginatedPayload } from '../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../shared/models/table.models';
import { RolesAccess } from '../../models/roles-access.model';
import { UserService } from '../../services/user.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogData } from '../../../../shared/models/dialog.models';
import { UserDialogComponent } from './components/user-dialog/user-dialog.component';
import { CustomErrorResponse } from '../../../../shared/models/custom-error.models';

const tableColumns: TableColumnsData = {
  columns: [
    { field: 'name', displayName: 'Name', sortedColumn: true, hasChip: false },
    { field: 'roles', displayName: 'Role', sortedColumn: true, hasChip: true },

    {
      field: 'actions',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      actions: [PaginatedDataActions.Edit, PaginatedDataActions.Delete],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: ['registeredName', 'actions'],
};
@Component({
  selector: 'app-roles-access',
  imports: [TableComponent, Toast],
  providers: [TableDataSourceService],
  templateUrl: './roles-access.component.html',
  styleUrl: './roles-access.component.scss',
})
export class RolesAccessComponent implements OnInit {
  public data!: any;
  public columns: TableColumnsData = tableColumns;

  private ref: DynamicDialogRef | undefined;

  constructor(
    public dialog: DialogService,
    private userService: UserService,
    private dataSourceService: TableDataSourceService<any>,
    private messageService: MessageService,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getAllUsers(new PaginatedPayload());
  }

  // Public Methods
  public AddNewUser() {
    this.ref = this.dialog.open(UserDialogComponent, {
      header: 'Create User',
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
        // api call to create the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Created the User Successfully',
          });

          this.getAllUsers(new PaginatedPayload());
          console.log('successfully created the user', this.data);
        };
        const error = (error: CustomErrorResponse) => {
          const businerssErrorCode = error.error.businessError;
          if (businerssErrorCode === 4002) {
            this.openActivateUserModal(error.error.errorValue);
          } else if (businerssErrorCode === 4001) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'User Already Exists',
            });
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Creation failed',
          });
          console.log('ERROR', error);
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
        // api call to edit the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Updated the User Successfully',
          });
          this.getAllUsers(new PaginatedPayload());
        };
        const error = (error: string) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Updation is failed',
          });
          console.log('ERROR', error);
        };
        this.userService.updateEntity('', result).subscribe({ next, error });
      }
    });
  }

  public deleteUser(userId: string) {
    const modalData: DialogData = {
      message: 'Are you sure you want to to delete the user?',
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
        // api call to delete the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the User Successfully',
          });
          this.getAllUsers(new PaginatedPayload());
        };
        const error = (error: string) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Deletion is failed',
          });
          console.log('ERROR', error);
        };
        this.userService.deleteEntityById(userId).subscribe({ next, error });
      }
    });
  }

  public deleteSelectedUsers(selectedUsersIds: string[]) {
    const modalData: DialogData = {
      message: 'Are you sure you want to to delete the selected users?',
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
        // api call to delete the users
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the Selected Users Successfully',
          });
          this.getAllUsers(new PaginatedPayload());
        };
        const error = (error: string) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Deletion is failed',
          });
          console.log('ERROR', error);
        };
        this.userService
          .updateEntity('', selectedUsersIds, 'deactivate')
          .subscribe({ next, error });
      }
    });
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.loadData(payload);
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
      console.log('Data', this.data);
    });
  }

  private getAllUsers(payload: PaginatedPayload) {
    payload.filterMap = {
      excludedRoles: ['5'],
    };

    const next = (res: any) => {
      // this.data = res;

      const formattedData = res.data.map((item: any) => ({
        ...item,
        roles: item.roles ? item.roles.split(',') : [],
      }));
      this.data = { ...res, data: formattedData };
      console.log('Data', this.data);
    };

    const error = (error: string) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load User list',
      });
      console.log('ERROR', error);
    };

    this.userService.paginationEntity('all', payload).subscribe({
      next,
      error,
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
        // api call to activate the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Activated the User Successfully',
          });
          this.getAllUsers(new PaginatedPayload());
        };
        const error = (error: string) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Activation of user is failed',
          });
          console.log('ERROR', error);
        };
        this.userService.updateEntity(userId).subscribe({ next, error });
      }
    });
  }
}
