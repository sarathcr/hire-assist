/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { CollectionService } from '../../../../shared/services/collection.service';

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
  @ViewChild(TableComponent) tableComponent!: TableComponent<any>;

  public data!: any;
  public columns: TableColumnsData = tableColumns;
  public selectedUsers: string[] = [];
  public isLoading = false;
  public activateUserPayload!: any;
  private ref: DynamicDialogRef | undefined;
  private currentPayload: PaginatedPayload = new PaginatedPayload();

  constructor(
    public dialog: DialogService,
    private readonly userService: UserService,
    private readonly dataSourceService: TableDataSourceService<any>,
    private readonly messageService: MessageService,
    public storeService: StoreService,
    private readonly collectionService: CollectionService,
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
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.ref.onClose.subscribe((result) => {
      if (result) {
        this.setDataToCollection(result);
        this.isLoading = true;
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Created the User Successfully',
          });
          this.isLoading = false;
          this.getAllUsers(new PaginatedPayload());
        };
        const error = (error: CustomErrorResponse) => {
          this.isLoading = false;
          const businerssErrorCode = error.error.businessError;
          if (businerssErrorCode === 4002) {
            this.openActivateUserModal(error.error.errorValue, result);
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
      focusOnShow: false,
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
          this.updateRoleCollections(result);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Updated User Successfully',
          });

          this.getAllUsers(new PaginatedPayload());
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
              detail: error.error.type
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
      if (result) {
        this.isLoading = true;

        const next = () => {
          this.deleteUserFromAllCollections(userId);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted User Successfully',
          });
          this.selectedUsers = this.selectedUsers.filter((id) => id !== userId);
          this.getAllUsers(new PaginatedPayload());
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
    this.selectedUsers = selectedUsersIds.map((item: RolesAccess) => item.id!);
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
      if (result) {
        this.isLoading = true;
        const next = () => {
          if (this.selectedUsers.length > 0) {
            this.selectedUsers.forEach((userId) => {
              this.deleteUserFromAllCollections(userId);
            });
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted Selected Users Successfully',
          });
          this.selectedUsers = [];
          // Clear all selections in the table component

          this.tableComponent?.clearAllSelections();
          this.getAllUsers(new PaginatedPayload());
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
      filterMap: { excludedRoles: ['5'], ...payload.filterMap },
      pagination: {
        ...payload.pagination,
      },
    };
    this.loadData(this.currentPayload);
  }

  public getAllUsers(payload: PaginatedPayload) {
    this.isLoading = true;
    const payloadData = {
      ...payload,
      filterMap: { excludedRoles: ['5'], ...payload.filterMap },
    };
    const currentUser = this.storeService.getUserData();
    const next = (res: any) => {
      const formattedData = res.data.map((item: any) => ({
        ...item,
        roles: item.roles ? item.roles.split(',') : [],
        isSelf: item.email === currentUser.id || item.id === currentUser.id,
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

    this.userService.paginationEntity('all', payloadData).subscribe({
      next,
      error,
    });
  }
  // Private Methods
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${USER_URL}/all`);
  }

  private loadData(payload: PaginatedPayload): void {
    const currentUser = this.storeService.getUserData();
    this.dataSourceService.getData(payload).subscribe((response: any) => {
      const formattedData = response.data.map((item: any) => ({
        ...item,
        roles: item.roles ? item.roles.split(',') : [],
        isSelf: item.email === currentUser.id || item.id === currentUser.id,
      }));
      this.data = { ...response, data: formattedData };
    });
  }

  private openActivateUserModal(userId: string, result: any) {
    const modalData: DialogData = {
      message:
        'This user already exist but is not active. Do you want to activate the user.',
      isChoice: true,
      cancelButtonText: 'Close',
      acceptButtonText: 'Activate',
    };
    const payload = { ...result, id: userId };
    console.log('Activate payload:', payload);
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '50vw',
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
    this.ref.onClose.subscribe((res: boolean) => {
      if (res) {
        console.log('Activating user with ID:', res);
        this.isLoading = true;
        // api call to activate the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Activated the User Successfully',
          });
          this.getAllUsers(new PaginatedPayload());
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
        this.userService.ActivateUser(payload).subscribe({ next, error });
      }
    });
  }

  private setDataToCollection(result: any) {
    if (!Array.isArray(result.roles)) return;

    const roleCollectionMap: Record<string, string> = {
      '4': 'interviewers',
      '1': 'coordinators',
      '6': 'frontdesks',
    };

    for (const role of result.roles) {
      const collectionName = roleCollectionMap[role];
      if (collectionName) {
        this.collectionService.updateCollection(collectionName, {
          id: result.email,
          title: result.name,
        });
      }
    }
  }

  private deleteUserFromAllCollections(userId: string) {
    const collections = ['interviewers', 'coordinators', 'frontdesks'];

    const currentCollection = this.storeService.getCollection() || {};

    for (const key of collections) {
      const items = currentCollection[key] || [];

      const exists = items.some(
        (item: any) => item.value === userId.toString(),
      );

      if (exists) {
        this.collectionService.deleteItemFromCollection(key, userId);
      }
    }
  }

  private updateRoleCollections(user: any) {
    const map: Record<string, string> = {
      '4': 'interviewers',
      '1': 'coordinators',
      '6': 'frontdesks',
    };

    Object.values(map).forEach((col) => {
      this.collectionService.deleteItemFromCollection(col, user.email);
    });

    user.roles.forEach((role: string) => {
      const col = map[role];
      if (col) {
        this.collectionService.updateCollection(col, {
          id: user.email,
          title: user.name,
        });
      }
    });
  }
}
