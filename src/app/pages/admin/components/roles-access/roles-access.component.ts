/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { HistoryDrawerComponent } from '../../../../shared/components/history-drawer/history-drawer.component';
import { TableDataSourceService } from '../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { USER_URL } from '../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../shared/models/dialog.models';
import {
  getDefaultPayload,
  PaginatedPayload,
  setSavedPayload,
} from '../../../../shared/models/pagination.models';
import {
  FieldType,
  TableColumnsData,
} from '../../../../shared/models/table.models';
import { UserState } from '../../../../shared/models/user.models';
import { CollectionService } from '../../../../shared/services/collection.service';
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
      width: 2,
      filterAlias: 'textFilter',
    },
    {
      field: 'roles',
      displayName: 'Role',
      sortedColumn: true,
      hasChip: true,
      hasTextFilter: true,
      filterAlias: 'textFilter',
      width: 4,
    },
    {
      field: 'department',
      displayName: 'Department',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
      width: 2,
    },

    {
      field: 'button',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      buttonIcons: ['pi pi-pencil', 'pi pi-history'],
      buttonLabels: ['Edit', 'History'],
      buttonTooltips: ['Edit', 'History'],
      sortedColumn: false,
      hasChip: false,
      width: 1,
    },
  ],
  displayedColumns: [],
};
@Component({
  selector: 'app-roles-access',
  imports: [
    CommonModule,
    TableComponent,
    ButtonComponent,
    HistoryDrawerComponent,
    DialogModule,
  ],
  providers: [TableDataSourceService],
  templateUrl: './roles-access.component.html',
  styleUrl: './roles-access.component.scss',
})
export class RolesAccessComponent implements OnInit, OnDestroy {
  @ViewChild(TableComponent) tableComponent!: TableComponent<any>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  public data!: any;
  public columns: TableColumnsData = tableColumns;
  public selectedUsers: string[] = [];
  public isLoading = false;
  public activateUserPayload!: any;
  public currentUser!: UserState;
  private ref: DynamicDialogRef | undefined;
  private currentPayload: PaginatedPayload = new PaginatedPayload();
  private previousFilterMap: any = {};
  private isManualRefresh = false;
  public visible = false;
  public historyEvents: any[] = [];
  public historyLoading = false;

  public isSyncing = false;
  public canShowSyncButton = false;
  public showConfirmSyncModal = false;

  public showBridgeWalkthroughModal = false;
  public selectedBridgeOs: 'windows' | 'linux' = 'windows';
  public bridgePollInterval: any = null;
  public isBridgeConnected = false;
  public bridgeDownloadUrlWindows = '';
  public bridgeDownloadUrlLinux = '';

  public isSetupInProgress = false;
  public setupStage: 'idle' | 'downloading' | 'extracting' | 'connected' | 'error' = 'idle';
  public setupProgressPercent = 0;
  public setupStatusText = '';
  public showManualSteps = false;
  public hasBridgeError = false;
  public setupTimeoutTimer: any = null;
  public bridgeErrorMessage = '';

  public showConfirmUploadModal = false;
  public selectedCsvFile: File | null = null;
  public selectedCsvFileName = '';
  public selectedCsvFileSize = '';

  public showErrorModal = false;
  public errorModalTitle = '';
  public errorModalSubtitle = '';
  public errorModalItems: string[] = [];
  public errorModalRawMessage = '';
  public errorModalTip: string | null = null;

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
    this.canShowSyncButton = this.checkSyncButtonEligibility();
    this.setPaginationEndpoint();
    const initialPayload = getDefaultPayload('RolesAccessComponent');
    this.currentPayload = initialPayload;
    this.getAllUsers(initialPayload);
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.canShowSyncButton = this.checkSyncButtonEligibility();
  }
  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
    if (this.bridgePollInterval) {
      clearInterval(this.bridgePollInterval);
      this.bridgePollInterval = null;
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
        // Prevent if user tries to assign Super Admin role and current user is not superadmin
        const currentUserRole = this.storeService.getUserRole() || [];
        const isCurrentUserSuperAdmin = currentUserRole.includes('superadmin');

        const optionsMap = this.storeService.getCollection() || {};
        const rolesList = optionsMap['roles'] || [];
        const superAdminRoleOption = rolesList.find(
          (r: any) =>
            r.value === '2' ||
            r.value === 2 ||
            r.label?.toLowerCase()?.replace(/\s+/g, '') === 'superadmin',
        );
        const superAdminCode = superAdminRoleOption?.value || '2';
        const superAdminLabel = superAdminRoleOption?.label;

        const hasSuperAdminRole = result.roles?.some(
          (r: any) =>
            r === superAdminCode ||
            r === Number(superAdminCode) ||
            r === superAdminLabel ||
            (typeof r === 'string' &&
              r.toLowerCase().replace(/\s+/g, '') === 'superadmin'),
        );

        if (hasSuperAdminRole && !isCurrentUserSuperAdmin) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Only super admin users can assign the super admin role.',
          });
          return;
        }

        this.setDataToCollection(result);
        this.isLoading = true;
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Created the User Successfully',
          });
          this.getAllUsers(this.currentPayload);
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
              detail: error.error.type || 'User Already Exists',
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
              detail: error.error.type || 'Creation failed',
            });
          }
        };

        this.userService.createEntity(result).subscribe({ next, error });
      }
    });
  }

  public editUser(userData: RolesAccess) {
    if ((userData as any).isSelf) {
      return;
    }

    const currentUserRole = this.storeService.getUserRole() || [];
    const isCurrentUserSuperAdmin = currentUserRole.includes('superadmin');
    const isTargetSuperAdmin = userData.roles?.some((role: any) => {
      const normalized =
        typeof role === 'string'
          ? role.trim().toLowerCase().replace(/[\s_]+/g, '')
          : String(role);
      return normalized === 'superadmin' || normalized === '2' || role === 2;
    });

    if (isTargetSuperAdmin && !isCurrentUserSuperAdmin) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Only super admin can edit role of another super admin.',
      });
      return;
    }

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
        // Prevent if user tries to assign/maintain Super Admin role and current user is not superadmin
        const currentUserRole = this.storeService.getUserRole() || [];
        const isCurrentUserSuperAdmin = currentUserRole.includes('superadmin');

        const optionsMap = this.storeService.getCollection() || {};
        const rolesList = optionsMap['roles'] || [];
        const superAdminRoleOption = rolesList.find(
          (r: any) =>
            r.value === '2' ||
            r.value === 2 ||
            r.label?.toLowerCase()?.replace(/\s+/g, '') === 'superadmin',
        );
        const superAdminCode = superAdminRoleOption?.value || '2';
        const superAdminLabel = superAdminRoleOption?.label;

        const hasSuperAdminRole = result.roles?.some(
          (r: any) =>
            r === superAdminCode ||
            r === Number(superAdminCode) ||
            r === superAdminLabel ||
            (typeof r === 'string' &&
              r.toLowerCase().replace(/\s+/g, '') === 'superadmin'),
        );

        if (hasSuperAdminRole && !isCurrentUserSuperAdmin) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Only super admin users can assign the super admin role.',
          });
          return;
        }

        this.isLoading = true;
        // api call to edit the user
        const next = () => {
          this.updateRoleCollections(result);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Updated User Successfully',
          });
          this.getAllUsers(this.currentPayload);
        };
        const error = (error: CustomErrorResponse) => {
          this.isLoading = false;
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
              detail: error.error.type,
            });
          }
        };
        this.userService.updateEntity('', result).subscribe({ next, error });
      }
    });
  }

  public deleteUser(userId: string) {
    const user = this.data?.data?.find((u: any) => u.id === userId);
    if (user?.isSelf) {
      return;
    }

    // Add client-side validation to prevent deleting a super admin by a non-superadmin
    const currentUserRole = this.storeService.getUserRole() || [];
    const isCurrentUserSuperAdmin = currentUserRole.includes('superadmin');

    const hasSuperAdminRole = user?.roles?.some((roleLabel: string) => {
      const normalized = roleLabel.toLowerCase().replace(/\s+/g, '');
      return normalized === 'superadmin' || normalized === 'super_admin';
    });

    if (hasSuperAdminRole && !isCurrentUserSuperAdmin) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Only super admin users can delete super admins.',
      });
      return;
    }
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
          this.getAllUsers(this.currentPayload);
        };
        const error = (error: CustomErrorResponse) => {
          this.isLoading = false;
          if (error?.error?.businessError === 3111) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.formatDeleteErrorMessage(error?.error?.type),
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail:
                error?.error?.type ||
                error?.error?.message ||
                error?.error?.errorValue ||
                'Deletion is failed',
            });
          }
        };
        this.userService.deleteEntityById(userId).subscribe({ next, error });
      }
    });
  }

  public viewHistory(id: string) {
    this.historyLoading = true;
    this.userService
      .getUserHistory(id)
      .pipe(finalize(() => (this.historyLoading = false)))
      .subscribe({
        next: (res: any[]) => {
          this.historyEvents = res.map((event) => {
            let description = '';
            if (event.action === 'Updated' && event.field) {
              description = `${event.field} changed from "${event.previousValue}" to "${event.currentValue}"`;
            }

            return {
              status: event.action,
              description: description,
              user: event.changedByName,
              date: new Date(event.changedAt + 'Z'),
              icon: event.action === 'Created' ? 'pi pi-plus' : 'pi pi-pencil',
            };
          });
          this.visible = true;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load user history',
          });
        },
      });
  }

  public onButtonClick(data: { event: any; fName: string }): void {
    const { event, fName } = data;
    if (event.isSelf) {
      return;
    }

    if (fName === 'Edit') {
      const currentUserRole = this.storeService.getUserRole() || [];
      const isCurrentUserSuperAdmin = currentUserRole.includes('superadmin');
      const isTargetSuperAdmin = event?.roles?.some((role: any) => {
        const normalized =
          typeof role === 'string'
            ? role.trim().toLowerCase().replace(/[\s_]+/g, '')
            : String(role);
        return normalized === 'superadmin' || normalized === '2' || role === 2;
      });

      if (isTargetSuperAdmin && !isCurrentUserSuperAdmin) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Only super admin can edit role of another super admin.',
        });
        return;
      }
      this.editUser(event);
      return;
    }

    switch (fName) {
      case 'History':
        this.viewHistory(event.id);
        break;
      default:
        break;
    }
  }

  public onCsvFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File',
        detail: 'Please select a valid CSV (.csv) file.',
      });
      input.value = '';
      return;
    }

    this.selectedCsvFile = file;
    this.selectedCsvFileName = file.name;
    this.selectedCsvFileSize = this.formatFileSize(file.size);
    this.showConfirmUploadModal = true;
  }

  public cancelCsvUpload() {
    this.showConfirmUploadModal = false;
    this.selectedCsvFile = null;
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  public proceedWithCsvUpload() {
    this.showConfirmUploadModal = false;
    if (!this.selectedCsvFile) {
      return;
    }

    const fileToUpload = this.selectedCsvFile;
    this.isLoading = true;
    this.userService.importUsers(fileToUpload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.selectedCsvFile = null;
        if (this.fileInputRef?.nativeElement) {
          this.fileInputRef.nativeElement.value = '';
        }
        const createdCount = res?.createdCount ?? 0;
        const updatedCount = res?.updatedCount ?? 0;
        const deactivatedCount = res?.deactivatedCount ?? 0;
        const total = res?.totalProcessed ?? (createdCount + updatedCount);

        let detailMsg = `Successfully imported ${total} user${total > 1 ? 's' : ''} (${createdCount} created, ${updatedCount} updated`;
        if (deactivatedCount > 0) {
          detailMsg += `, ${deactivatedCount} removed`;
        }
        detailMsg += ').';

        this.messageService.add({
          severity: 'success',
          summary: 'Import Successful',
          detail: detailMsg,
        });
        this.collectionService.getCollection(true);
        this.getAllUsers(this.currentPayload);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.selectedCsvFile = null;
        if (this.fileInputRef?.nativeElement) {
          this.fileInputRef.nativeElement.value = '';
        }
        const rawError =
          err?.error?.errorValue ||
          err?.error?.type ||
          err?.error?.message ||
          err?.message ||
          'Failed to import users from CSV.';
        this.handleImportError(rawError);
      },
    });
  }

  
  public checkSyncButtonEligibility(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    // 1. Must be desktop width (1024px or higher)
    const width =
      window.innerWidth ||
      document.documentElement?.clientWidth ||
      document.body?.clientWidth ||
      0;
    if (width < 1024) {
      return false;
    }

    const ua = (navigator.userAgent || '').toLowerCase();
    const platform = (navigator.platform || '').toLowerCase();
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    // 2. Hide on mobile devices
    const isMobile =
      /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
    if (isMobile) {
      return false;
    }

    // 3. Hide on iPads and tablets (iPadOS 13+ reports MacIntel with touch points)
    const isTablet =
      /ipad|tablet/i.test(ua) || (platform.includes('mac') && maxTouchPoints > 1);
    if (isTablet) {
      return false;
    }

    // 4. Hide on macOS (MacBook, iMac, Mac mini, Mac Studio)
    const isMac =
      /macintosh|mac os x|mac_powerpc/i.test(ua) || platform.includes('mac');
    if (isMac) {
      return false;
    }

    // 5. Allowed exclusively on Windows and Linux/Ubuntu desktops
    const isWindows = /win/i.test(ua) || platform.includes('win');
    const isLinuxOrUbuntu =
      (/linux|ubuntu|debian|x11/i.test(ua) || platform.includes('linux')) &&
      !ua.includes('android');

    return isWindows || isLinuxOrUbuntu;
  }

  public openConfirmSyncModal() {
    this.showConfirmSyncModal = true;
  }

  public cancelOpenOrgSync() {
    this.showConfirmSyncModal = false;
  }

  public async proceedWithOpenOrgSync() {
    this.showConfirmSyncModal = false;
    this.isSyncing = true;

    const resourceUrl = this.userService.getResourceUrl();
    const pushUrl = resourceUrl + '/sync-openorg-push';

    const isBridgeActive = await this.checkLocalBridgeHealth();

    if (isBridgeActive) {
      await this.performDirectBridgeSync(pushUrl);
    } else {
      this.isSyncing = false;
      this.selectedBridgeOs = this.detectUserOs();
      this.openBridgeWalkthroughModal();
    }
  }

  private async checkLocalBridgeHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('http://127.0.0.1:5123/health', {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      return data?.status === 'Active';
    } catch {
      return false;
    }
  }

  private async performDirectBridgeSync(pushUrl: string) {
    this.messageService.add({
      severity: 'info',
      summary: 'Connecting to OpenOrg',
      detail: 'Connecting to OpenOrg inside office network and synchronizing users...',
      life: 5000,
    });

    try {
      const res = await fetch('http://127.0.0.1:5123/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: pushUrl }),
      });

      if (res.ok) {
        const json = await res.json();
        this.handleSyncSuccess(json, 'Local Connector');
      } else {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || 'Sync request failed');
      }
    } catch (err) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falling back to Protocol Sync',
        detail: 'Direct connection failed. Launching protocol runner...',
        life: 4000,
      });
      this.launchProtocolSync(pushUrl);
    } finally {
      this.isSyncing = false;
    }
  }

  public detectUserOs(): 'windows' | 'linux' {
    const ua = (window.navigator?.userAgent || '').toLowerCase();
    if (ua.includes('linux') || ua.includes('ubuntu') || ua.includes('debian')) {
      return 'linux';
    }
    return 'windows';
  }

  public openBridgeWalkthroughModal() {
    this.showBridgeWalkthroughModal = true;
    this.isBridgeConnected = false;
    this.isSetupInProgress = false;
    this.setupStage = 'idle';
    this.setupProgressPercent = 0;
    this.setupStatusText = '';
    this.showManualSteps = false;
    this.hasBridgeError = false;
    this.bridgeErrorMessage = '';

    const resourceUrl = this.userService.getResourceUrl();
    this.bridgeDownloadUrlWindows = `${resourceUrl}/sync-bridge/download?os=windows`;
    this.bridgeDownloadUrlLinux = `${resourceUrl}/sync-bridge/download?os=linux`;

    this.startBridgePolling();
  }

  public startBridgePolling(enableTimeout: boolean = false) {
    if (this.bridgePollInterval) {
      clearInterval(this.bridgePollInterval);
    }

    if (enableTimeout) {
      if (this.setupTimeoutTimer) {
        clearTimeout(this.setupTimeoutTimer);
      }
      this.setupTimeoutTimer = setTimeout(() => {
        if (!this.isBridgeConnected) {
          this.hasBridgeError = true;
          this.setupStage = 'error';
          this.isSetupInProgress = false;
          this.bridgeErrorMessage =
            'Connector setup could not complete automatically (remote server package returned 404). Please use the CSV upload option below.';
          if (this.bridgePollInterval) {
            clearInterval(this.bridgePollInterval);
            this.bridgePollInterval = null;
          }
        }
      }, 15000);
    }

    this.bridgePollInterval = setInterval(async () => {
      const active = await this.checkLocalBridgeHealth();
      if (active) {
        if (this.setupTimeoutTimer) {
          clearTimeout(this.setupTimeoutTimer);
          this.setupTimeoutTimer = null;
        }
        clearInterval(this.bridgePollInterval);
        this.bridgePollInterval = null;
        this.isBridgeConnected = true;
        this.hasBridgeError = false;
        this.setupStage = 'connected';
        this.setupProgressPercent = 100;
        this.setupStatusText = 'Connector Activated! Synchronizing users...';

        this.messageService.add({
          severity: 'success',
          summary: 'Connector Ready',
          detail: 'Local OpenOrg connector detected! Starting synchronization...',
          life: 3000,
        });

        setTimeout(() => {
          this.isSetupInProgress = false;
          this.showBridgeWalkthroughModal = false;
          this.proceedWithOpenOrgSync();
        }, 1200);
      }
    }, 1500);
  }

  public async startAutomaticSetup() {
    this.isSetupInProgress = true;
    this.hasBridgeError = false;
    this.bridgeErrorMessage = '';
    this.setupStage = 'downloading';
    this.setupProgressPercent = 25;
    this.setupStatusText = 'Preparing 1-Click Silent Setup...';

    const os = this.selectedBridgeOs;
    const resourceUrl = this.userService.getResourceUrl();
    const downloadUrl = `${resourceUrl}/sync-bridge/download?os=${os}`;

    try {
      this.setupProgressPercent = 50;
      this.setupStatusText = 'Generating 1-click silent installer...';

      // Check package reachability
      try {
        const checkRes = await fetch(downloadUrl, { method: 'HEAD' });
        if (checkRes.status === 404) {
          throw new Error('Connector package is currently not available on the remote server (404 Not Found).');
        }
      } catch (checkErr: any) {
        if (checkErr?.message?.includes('404')) {
          throw checkErr;
        }
        // network or CORS issue on HEAD is ignored, proceed with script generation
      }

      const { content, fileName, mimeType } = this.generateInstallerScript(os, downloadUrl);
      const blob = new Blob([content], { type: mimeType });

      this.setupProgressPercent = 85;
      this.setupStatusText = 'Downloading installer file...';

      const downloadLink = document.createElement('a');
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(downloadLink.href);

      this.setupProgressPercent = 100;
      this.setupStage = 'extracting';
      this.setupStatusText =
        os === 'linux'
          ? 'Downloaded! Run ./install-connector.sh in terminal. It extracts and starts daemon silently.'
          : 'Downloaded! Click the downloaded Install-HireAssist-Connector.bat file in your browser downloads to activate.';

      this.startBridgePolling(true);
    } catch (err: any) {
      this.hasBridgeError = true;
      this.bridgeErrorMessage =
        err?.message || 'Unable to download connector. Please verify your connection or use CSV import.';
      this.setupStage = 'error';
      this.isSetupInProgress = false;
    }
  }

  public retryAutomaticSetup() {
    this.hasBridgeError = false;
    this.bridgeErrorMessage = '';
    this.startAutomaticSetup();
  }

  public switchToCsvUpload() {
    this.closeBridgeWalkthroughModal(true);
    setTimeout(() => {
      const fileInput =
        (document.getElementById('rolesAccessCsvFileInput') as HTMLInputElement) ||
        (document.querySelector('input[type="file"]') as HTMLInputElement);
      if (fileInput) {
        fileInput.click();
      }
    }, 200);
  }

  private generateInstallerScript(
    os: 'windows' | 'linux',
    downloadUrl: string
  ): { content: string; fileName: string; mimeType: string } {
    if (os === 'linux') {
      const sh = `#!/bin/bash
set -e
echo "======================================================="
echo "  HireAssist OpenOrg Connector - Automatic Setup (Linux)"
echo "======================================================="

INSTALL_DIR="\$HOME/.local/share/hireassist/syncbridge"
ZIP_PATH="/tmp/hireassist-bridge-linux.zip"
DOWNLOAD_URL="${downloadUrl}"

echo "[1/3] Downloading OpenOrg Connector in background..."
mkdir -p "\$INSTALL_DIR"
if ! curl -sSL "\$DOWNLOAD_URL" -o "\$ZIP_PATH"; then
  echo "[ERROR] Failed to download from server. Please upload users via CSV in the portal."
  exit 1
fi

echo "[2/3] Extracting files to \$INSTALL_DIR..."
unzip -q -o "\$ZIP_PATH" -d "\$INSTALL_DIR"
rm -f "\$ZIP_PATH"

EXE="\$INSTALL_DIR/HireAssist.SyncBridge"
if [ ! -f "\$EXE" ]; then
    EXE="\$INSTALL_DIR/linux-x64/HireAssist.SyncBridge"
fi
chmod +x "\$EXE" 2>/dev/null || true

echo "[3/3] Starting background daemon on port 5123..."
pkill -f "HireAssist.SyncBridge" 2>/dev/null || true
nohup "\$EXE" > "\$INSTALL_DIR/sync-bridge.log" 2>&1 &

AUTOSTART_DIR="\$HOME/.config/autostart"
mkdir -p "\$AUTOSTART_DIR"
cat << EOF > "\$AUTOSTART_DIR/hireassist-syncbridge.desktop"
[Desktop Entry]
Type=Application
Exec=\$EXE
Hidden=false
NoDisplay=true
X-GNOME-Autostart-enabled=true
Name=HireAssist Sync Bridge
Comment=Background bridge for HireAssist OpenOrg sync
EOF

echo ""
echo "======================================================="
echo "[SUCCESS] HireAssist Connector is now ACTIVE on port 5123!"
echo "Return to your browser - the setup will automatically complete."
echo "======================================================="
sleep 2
`;
      return { content: sh, fileName: 'install-connector.sh', mimeType: 'application/x-sh' };
    } else {
      const bat = `@echo off
setlocal enabledelayedexpansion
title HireAssist - OpenOrg Connector Silent Setup

echo ========================================================
echo   HireAssist OpenOrg Connector - Automatic Setup
echo ========================================================
echo.

:: 1. Check if executable already exists in local source tree
set "LOCAL_EXE="
if exist "%~dp0HireAssist.SyncBridge.exe" set "LOCAL_EXE=%~dp0HireAssist.SyncBridge.exe"
if exist "%~dp0publish\\HireAssist.SyncBridge.exe" set "LOCAL_EXE=%~dp0publish\\HireAssist.SyncBridge.exe"
if exist "%USERPROFILE%\\source\\repos\\hireassist.security\\Tools\\HireAssist.SyncBridge\\publish\\HireAssist.SyncBridge.exe" set "LOCAL_EXE=%USERPROFILE%\\source\\repos\\hireassist.security\\Tools\\HireAssist.SyncBridge\\publish\\HireAssist.SyncBridge.exe"
if exist "%USERPROFILE%\\source\\repos\\hireassist.security\\Tools\\HireAssist.SyncBridge\\HireAssist.SyncBridge.exe" set "LOCAL_EXE=%USERPROFILE%\\source\\repos\\hireassist.security\\Tools\\HireAssist.SyncBridge\\HireAssist.SyncBridge.exe"

if defined LOCAL_EXE (
    echo [FOUND] Using local connector binary: !LOCAL_EXE!
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name 'HireAssist.SyncBridge' -ErrorAction SilentlyContinue | Stop-Process -Force"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '!LOCAL_EXE!' -WindowStyle Hidden"
    echo [SUCCESS] Connector started silently on port 5123.
    timeout /t 2 >nul
    exit /b 0
)

set "INSTALL_DIR=%LOCALAPPDATA%\\HireAssist\\SyncBridge"
set "ZIP_PATH=%TEMP%\\hireassist-bridge-windows.zip"
set "DOWNLOAD_URL=${downloadUrl}"

echo [1/3] Downloading OpenOrg Connector in background...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('%DOWNLOAD_URL%', '%ZIP_PATH%')"

if not exist "%ZIP_PATH%" (
    echo [ERROR] Failed to download connector package from %DOWNLOAD_URL%.
    echo Please use the OpenOrg CSV upload feature in the web portal instead.
    echo.
    pause
    exit /b 1
)

echo [2/3] Extracting files to %INSTALL_DIR%...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%ZIP_PATH%' -DestinationPath '%INSTALL_DIR%' -Force"
del "%ZIP_PATH%" 2>nul

echo [3/3] Starting background daemon on port 5123...
set "EXE_PATH=%INSTALL_DIR%\\HireAssist.SyncBridge.exe"
if not exist "%EXE_PATH%" (
    set "EXE_PATH=%INSTALL_DIR%\\publish\\HireAssist.SyncBridge.exe"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name 'HireAssist.SyncBridge' -ErrorAction SilentlyContinue | Stop-Process -Force"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%EXE_PATH%' -WindowStyle Hidden"

reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "HireAssistSyncBridge" /d "\"\"%EXE_PATH%\"\"" /f >nul 2>&1

echo.
echo ========================================================
echo [SUCCESS] HireAssist OpenOrg Connector is now ACTIVE!
echo Return to your browser - the setup will automatically complete.
echo ========================================================
timeout /t 3 >nul
exit /b 0
`;
      return { content: bat, fileName: 'Install-HireAssist-Connector.bat', mimeType: 'application/x-bat' };
    }
  }

  public cancelSetup() {
    this.isSetupInProgress = false;
    this.setupStage = 'idle';
    if (this.setupTimeoutTimer) {
      clearTimeout(this.setupTimeoutTimer);
      this.setupTimeoutTimer = null;
    }
    if (this.bridgePollInterval) {
      clearInterval(this.bridgePollInterval);
      this.bridgePollInterval = null;
    }
  }

  public closeBridgeWalkthroughModal(force: boolean = false) {
    if (this.isSetupInProgress && !this.isBridgeConnected && !force) {
      return;
    }
    this.showBridgeWalkthroughModal = false;
    this.isSetupInProgress = false;
    this.setupStage = 'idle';
    this.hasBridgeError = false;
    this.bridgeErrorMessage = '';
    if (this.setupTimeoutTimer) {
      clearTimeout(this.setupTimeoutTimer);
      this.setupTimeoutTimer = null;
    }
    if (this.bridgePollInterval) {
      clearInterval(this.bridgePollInterval);
      this.bridgePollInterval = null;
    }
  }

  private launchProtocolSync(pushUrl: string) {
    const protocolUrl = 'hireassist://sync?pushUrl=' + encodeURIComponent(pushUrl);
    window.location.href = protocolUrl;

    this.messageService.add({
      severity: 'info',
      summary: 'Sync Tool Triggered',
      detail:
        'Launching local OpenOrg sync tool on your machine. Fetching users from office network and pushing to HireAssist...',
      life: 6000,
    });

    setTimeout(() => {
      this.isSyncing = false;
      this.collectionService.getCollection(true);
      this.getAllUsers(this.currentPayload);
    }, 4500);
  }

  private handleSyncSuccess(res: any, source: string) {
    const createdCount = res?.createdCount ?? 0;
    const updatedCount = res?.updatedCount ?? 0;
    const deactivatedCount = res?.deactivatedCount ?? 0;
    const total = res?.totalProcessed ?? (createdCount + updatedCount);

    let detailMsg =
      'Successfully synchronized ' +
      total +
      ' user' +
      (total > 1 ? 's' : '') +
      ' from OpenOrg (' +
      createdCount +
      ' created, ' +
      updatedCount +
      ' updated';
    if (deactivatedCount > 0) {
      detailMsg += ', ' + deactivatedCount + ' deactivated';
    }
    detailMsg += ').';

    this.messageService.add({
      severity: 'success',
      summary: 'OpenOrg Sync Successful (' + source + ')',
      detail: detailMsg,
    });
    this.collectionService.getCollection(true);
    this.getAllUsers(this.currentPayload);
  }

  public handleImportError(rawError: string) {
    let cleaned = (rawError || '').replace(/^\[\d+\]\s*(Invalid data\s*)?/i, '').trim();
    if (cleaned.endsWith('!') && !cleaned.includes('\n')) {
      cleaned = cleaned.substring(0, cleaned.length - 1).trim();
    }

    const lines = cleaned.split('\n');
    const bulletItems: string[] = [];
    const nonBulletLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        bulletItems.push(trimmed.replace(/^[•\-]\s*/, '').trim());
      } else if (trimmed.length > 0) {
        nonBulletLines.push(trimmed);
      }
    }

    const lowerText = cleaned.toLowerCase();
    if (lowerText.includes('active recruitment') || lowerText.includes('participating in active recruitments')) {
      this.errorModalTitle = 'Active Recruitment Conflict';
      this.errorModalSubtitle =
        nonBulletLines[0] ||
        'The uploaded CSV is missing user(s) currently assigned to active recruitments in the system:';
      this.errorModalItems = bulletItems;
      this.errorModalTip =
        'These users cannot be removed while participating in active recruitments. Please ensure all active recruitment interviewers, coordinators, panel members, and front desk staff are included in your CSV file before re-uploading.';
      this.errorModalRawMessage = bulletItems.length === 0 ? cleaned : '';
    } else if (lowerText.includes('validation failed') || lowerText.includes('validation error')) {
      this.errorModalTitle = 'CSV Validation Failed';
      this.errorModalSubtitle =
        nonBulletLines[0] ||
        'The uploaded CSV contains validation errors. Please resolve them and try again:';
      this.errorModalItems = bulletItems;
      this.errorModalTip =
        'Required columns are "First Name" (or Name) and "Email". Each row must contain a valid email address and non-empty name (max 150 characters).';
      this.errorModalRawMessage = bulletItems.length === 0 ? cleaned : '';
    } else {
      this.errorModalTitle = 'Import Failed';
      this.errorModalSubtitle =
        nonBulletLines[0] || 'An error occurred while importing users from CSV:';
      this.errorModalItems = bulletItems;
      this.errorModalRawMessage = bulletItems.length === 0 ? cleaned : '';
      this.errorModalTip = null;
    }

    this.showErrorModal = true;
  }

  public closeErrorModal() {
    this.showErrorModal = false;
    this.errorModalItems = [];
    this.errorModalRawMessage = '';
    this.errorModalTip = null;
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  public getSelectedItems(selectedUsersIds: RolesAccess[]) {
    this.selectedUsers = selectedUsersIds.map((item: RolesAccess) => item.id!);
  }

  public deleteSelectedUsers() {
    // Add client-side validation to prevent deleting a super admin by a non-superadmin
    const currentUserRole = this.storeService.getUserRole() || [];
    const isCurrentUserSuperAdmin = currentUserRole.includes('superadmin');

    if (!isCurrentUserSuperAdmin) {
      const hasSuperAdminInSelection = this.selectedUsers.some((userId) => {
        const user = this.data?.data?.find((u: any) => u.id === userId);
        return user?.roles?.some((roleLabel: string) => {
          const normalized = roleLabel.toLowerCase().replace(/\s+/g, '');
          return normalized === 'superadmin' || normalized === 'super_admin';
        });
      });

      if (hasSuperAdminInSelection) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Only super admin users can delete super admins.',
        });
        return;
      }
    }

    const modalData: DialogData = {
      message: `Are you sure you want to delete the selected user${this.selectedUsers.length > 1 ? 's' : ''}?`,
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
        this.selectedUsers = this.selectedUsers.filter(
          (u) => u !== this.currentUser.id,
        );
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

          this.isManualRefresh = true;
          this.tableComponent?.clearAllSelections();
          this.getAllUsers(this.currentPayload);
        };
        const error = (error: CustomErrorResponse) => {
          this.isLoading = false;
          if (error?.error?.businessError === 3111) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.formatDeleteErrorMessage(error?.error?.type),
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail:
                error?.error?.type ||
                error?.error?.message ||
                error?.error?.errorValue ||
                'Deletion is failed',
            });
          }
        };
        this.userService
          .updateEntity('', this.selectedUsers, 'deactivate')
          .subscribe({ next, error });
      }
    });
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    const isSearch =
      JSON.stringify(payload.filterMap) !==
      JSON.stringify(this.previousFilterMap);

    if (isSearch) {
      payload.pagination.pageNumber = 1;
    }

    this.previousFilterMap = JSON.parse(JSON.stringify(payload.filterMap));
    this.currentPayload = payload;
    setSavedPayload('RolesAccessComponent', payload);
    this.loadData(payload);
  }

  private formatUserData(data: any[]): any[] {
    const currentUserRole = this.storeService.getUserRole() || [];
    const isCurrentUserSuperAdmin = currentUserRole.includes('superadmin');

    return (data || []).map((item: any) => {
      const rawRoles = item.roles
        ? (Array.isArray(item.roles) ? item.roles : item.roles.split(','))
            .map((r: any) => (typeof r === 'string' ? r.trim() : r))
            .filter((r: any) => r !== undefined && r !== null && r !== '')
        : [];

      const isTargetSuperAdmin = rawRoles.some((role: any) => {
        const normalized =
          typeof role === 'string'
            ? role.trim().toLowerCase().replace(/[\s_]+/g, '')
            : String(role);
        return normalized === 'superadmin' || normalized === '2' || role === 2;
      });

      const isSelf =
        item.email === this.currentUser?.id ||
        item.id === this.currentUser?.id;

      const disabledButtonIndices: number[] = [];
      const disabledButtonTooltips: string[] = ['', ''];

      // Non-superadmin cannot edit a Super Admin
      if (!isCurrentUserSuperAdmin && isTargetSuperAdmin) {
        disabledButtonIndices.push(0);
        disabledButtonTooltips[0] =
          'Only super admin can edit role of another super admin';
      }

      return {
        ...item,
        roles: rawRoles,
        isSelf,
        disabledButtonIndices,
        disabledButtonTooltips,
      };
    });
  }

  public getAllUsers(payload: PaginatedPayload) {
    this.isManualRefresh = true;
    this.isLoading = true;
    const payloadData = {
      ...payload,
      filterMap: { excludedRoles: ['5'], ...payload.filterMap },
    };
    this.currentUser = this.storeService.getUserData();
    this.userService
      .paginationEntity('all', payloadData)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.isManualRefresh = false;
        }),
      )
      .subscribe({
        next: (res: any) => {
          const formattedData = this.formatUserData(res?.data);
          this.data = { ...res, data: formattedData };
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.type || 'Failed to load User list',
          });
        },
      });
  }
  // Private Methods
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${USER_URL}/all`);
  }

  private loadData(payload: PaginatedPayload): void {
    this.currentUser = this.storeService.getUserData();
    this.isLoading = true;

    const payloadData = {
      ...payload,
      filterMap: { excludedRoles: ['5'], ...payload.filterMap },
    };

    this.dataSourceService
      .getData(payloadData)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((response: any) => {
        const formattedData = this.formatUserData(response?.data);
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
        this.isLoading = true;
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Activated the User Successfully',
          });
          this.getAllUsers(this.currentPayload);
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

  private formatDeleteErrorMessage(errorDetail: string): string {
    if (!errorDetail) {
      return '';
    }
    // Normalize newlines to spaces and trim extra spaces
    const cleanDetail = errorDetail.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

    // Check if it's the 3111 delete reference error pattern
    const separator = /not deleted due to reference in/i;
    if (separator.test(cleanDetail)) {
      const parts = cleanDetail.split(separator);
      const entityPart = parts[0].replace(/^(?:\[3111\]\s*)?entities?\s+/i, '').trim();
      const entities = entityPart.split(',').map((e) => e.trim()).filter(Boolean);

      const restPart = parts[1].trim();
      const dotIndex = restPart.indexOf('.');
      const referenceIn = dotIndex !== -1 ? restPart.substring(0, dotIndex).trim() : restPart;
      const extraMsg = dotIndex !== -1 ? restPart.substring(dotIndex + 1).trim() : '';

      let html = `<div style="font-weight: 500; margin-bottom: 6px;">Entity/entities were not deleted due to reference in ${referenceIn}:</div>`;
      html += `<ul style="margin: 0 0 6px 0; padding-left: 18px; list-style-type: disc; display: flex; flex-direction: column; gap: 4px;">`;
      entities.forEach((entity) => {
        html += `<li style="word-break: break-all;">${entity}</li>`;
      });
      html += `</ul>`;
      if (extraMsg) {
        html += `<div style="font-size: 0.95em; opacity: 0.9;">${extraMsg}</div>`;
      }
      return html;
    }
    return errorDetail;
  }
}
