/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { finalize } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { HistoryDrawerComponent } from '../../../../../../shared/components/history-drawer/history-drawer.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import {
  getDefaultPayload,
  PaginatedData,
  PaginatedPayload,
  setSavedPayload,
} from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { InstructionService } from '../../../../services/instruction.service';
import {
  AptitudeInstructionSummary,
  CreateAptitudeInstructionRequest,
  SaveAsNewVersionRequest,
  UpdateAptitudeInstructionRequest,
} from '../../../../models/instruction.model';
import {
  InstructionDialogComponent,
  InstructionDialogData,
} from './instruction-dialog/instruction-dialog.component';
import { extractErrorMessage } from '../../../../../../shared/utilities/error.utility';

export interface InstructionTableRow {
  id: string;
  rawId: number;
  title: string;
  description: string;
  version: string;
  isDefault: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  rawItem: AptitudeInstructionSummary;
}

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'title',
      displayName: 'Title',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
      width: 3,
    },
    {
      field: 'description',
      displayName: 'Description',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
      width: 3,
    },
    {
      field: 'version',
      displayName: 'Version',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
      width: 1,
    },
    {
      field: 'isDefault',
      displayName: 'Default',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
      width: 1,
    },
    {
      field: 'status',
      displayName: 'Status',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'selectFilter',
      hasMultiStatus: false,
      width: 1,
    },
    {
      field: 'createdAt',
      displayName: 'Created At',
      fieldType: FieldType.StringToDate,
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
      buttonIcons: [
        'pi pi-eye',
        'pi pi-copy',
        'pi pi-pencil',
        'pi pi-trash',
        'pi pi-history',
      ],
      buttonLabels: ['Preview', 'New Version', 'Edit', 'Delete', 'History'],
      buttonTooltips: ['Preview', 'New Version', 'Edit', 'Delete', 'History'],
      sortedColumn: false,
      hasChip: false,
      width: 1,
    },
  ],
  displayedColumns: [
    'title',
    'description',
    'version',
    'isDefault',
    'status',
    'createdAt',
    'actions',
  ],
};

@Component({
  selector: 'app-instructions',
  standalone: true,
  imports: [TableComponent, ButtonComponent, HistoryDrawerComponent],
  providers: [DialogService],
  templateUrl: './instructions.component.html',
  styleUrl: './instructions.component.scss',
})
export class InstructionsComponent implements OnInit, OnDestroy {
  private instructionService = inject(InstructionService);
  public dialogService = inject(DialogService);
  public messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  public data: PaginatedData<InstructionTableRow> = {
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
    data: [],
    succeeded: true,
    errors: [],
    message: '',
  };
  public columns: TableColumnsData = tableColumns;
  public isLoading = true;
  private currentPayload: PaginatedPayload = new PaginatedPayload();
  private previousFilterMap: any = {};
  private ref: DynamicDialogRef | undefined;

  // History Drawer State
  public visible: boolean = false;
  public events: any[] = [];
  public selectedInstructionId: any;
  public historyPageNumber: number = 1;
  public totalHistoryRecords: number = 0;
  public historyLoading: boolean = false;
  public hasMoreHistory: boolean = true;

  ngOnInit(): void {
    const initialPayload = getDefaultPayload('instructions', 10);
    this.currentPayload = initialPayload;
    this.getAllPaginatedInstructions(initialPayload);
  }

  ngOnDestroy(): void {
    if (this.ref) {
      this.ref.close();
    }
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
    setSavedPayload('instructions', payload);
    this.getAllPaginatedInstructions(payload);
  }

  public getAllPaginatedInstructions(payload: PaginatedPayload): void {
    this.isLoading = true;
    this.instructionService
      .getInstructionsPaginated(payload)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res: PaginatedData<AptitudeInstructionSummary>) => {
          if (res) {
            this.data = this.formatData(res);
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load aptitude test instructions.',
          });
        },
      });
  }

  private formatData(
    res: PaginatedData<AptitudeInstructionSummary>,
  ): PaginatedData<InstructionTableRow> {
    if (!res || !res.data) {
      return {
        pageNumber: res?.pageNumber || 1,
        pageSize: res?.pageSize || 10,
        totalPages: res?.totalPages || 1,
        totalRecords: res?.totalRecords || 0,
        data: [],
        succeeded: res?.succeeded ?? true,
        errors: res?.errors || [],
        message: res?.message || '',
      };
    }
    return {
      ...res,
      data: res.data.map((item) => ({
        id: item.id.toString(),
        rawId: item.id,
        title: item.title,
        description: item.description || '',
        version: item.version?.startsWith('v')
          ? item.version
          : `v${item.version}`,
        isDefault: item.isDefault ? 'Default' : '-',
        status: (item as any).status || (item.isActive ? 'Active' : 'Inactive'),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        rawItem: item,
      })),
    };
  }

  public loadInstructions(): void {
    this.getAllPaginatedInstructions(this.currentPayload);
  }

  public addNewInstruction(): void {
    this.openDialog('create');
  }

  public onEdit(itemOrRow: any): void {
    const rawItem: AptitudeInstructionSummary = itemOrRow?.rawItem || itemOrRow;
    this.openDialog('edit', rawItem.id);
  }

  public onPreview(itemOrRow: any): void {
    const rawItem: AptitudeInstructionSummary = itemOrRow?.rawItem || itemOrRow;
    this.openDialog('preview', rawItem.id);
  }

  public onCloneVersion(itemOrRow: any): void {
    const rawItem: AptitudeInstructionSummary = itemOrRow?.rawItem || itemOrRow;
    this.openDialog('clone', rawItem.id);
  }

  public onDelete(itemOrRow: any): void {
    const rawItem = itemOrRow?.rawItem || itemOrRow;
    const id = rawItem.id || Number(itemOrRow);
    const title = rawItem.title
      ? `"${rawItem.title}"`
      : 'this instruction template';

    const modalData: DialogData = {
      message: `Are you sure you want to delete ${title}?`,
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialogService.open(DialogComponent, {
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
        this.isLoading = true;
        this.instructionService.deleteInstruction(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Aptitude test instruction deleted successfully.',
            });
            this.loadInstructions();
          },
          error: (err: any) => {
            this.isLoading = false;
            const backendMsg =
              err?.error?.errorValue ||
              err?.error?.type ||
              err?.error?.message ||
              extractErrorMessage(err, 'Failed to delete instruction.');
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: backendMsg,
            });
            this.cdr.markForCheck();
          },
        });
      }
    });
  }

  public viewHistory(itemOrId: any): void {
    let id: number | null = null;
    if (typeof itemOrId === 'number') {
      id = itemOrId;
    } else if (typeof itemOrId === 'string') {
      id = parseInt(itemOrId, 10);
    } else if (itemOrId && typeof itemOrId === 'object') {
      id =
        itemOrId.rawItem?.id ||
        itemOrId.rawId ||
        (itemOrId.id ? Number(itemOrId.id) : null);
    }

    if (!id || isNaN(id)) {
      console.warn(
        'Could not determine instruction ID for history drawer:',
        itemOrId,
      );
      return;
    }

    this.selectedInstructionId = id;
    this.events = [];
    this.historyPageNumber = 1;
    this.hasMoreHistory = true;
    setTimeout(() => {
      this.visible = true;
      this.cdr.detectChanges();
      this.loadHistory();
    }, 0);
  }

  public loadHistory(): void {
    if (
      this.historyLoading ||
      !this.hasMoreHistory ||
      !this.selectedInstructionId
    )
      return;

    this.historyLoading = true;
    this.cdr.detectChanges();

    const payload = {
      pagination: {
        pageNumber: this.historyPageNumber,
        pageSize: 10,
      },
      filterMap: {
        instructionId: `${this.selectedInstructionId}`,
      },
      multiSortedColumns: [
        {
          active: 'ChangedAt',
          direction: 'desc',
        },
      ],
    };

    this.instructionService.getInstructionHistory(payload).subscribe({
      next: (res: any) => {
        const list = res?.data || [];
        const newEvents = list.map((item: any) => {
          let dateVal: Date | string = '--';
          if (item.changedAt) {
            const rawDate = String(item.changedAt);
            const isoString = rawDate.endsWith('Z') ? rawDate : `${rawDate}Z`;
            const parsed = new Date(isoString);
            dateVal = isNaN(parsed.getTime()) ? rawDate : parsed;
          }

          return {
            status: item.action || 'Updated',
            user: item.changedByName || 'System',
            date: dateVal,
            icon: this.getHistoryIcon(item.action),
            description: this.getHistoryDescription(item),
          };
        });

        this.events = [...this.events, ...newEvents];
        this.totalHistoryRecords = res?.totalRecords ?? this.events.length;
        this.hasMoreHistory = this.events.length < this.totalHistoryRecords;
        this.historyPageNumber++;
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.historyLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load instruction history.',
        });
        this.cdr.detectChanges();
      },
    });
  }

  private getHistoryIcon(action: string): string {
    switch (action) {
      case 'Created':
        return 'pi pi-plus';
      case 'Updated':
        return 'pi pi-pencil';
      case 'Deleted':
        return 'pi pi-trash';
      default:
        return 'pi pi-info-circle';
    }
  }

  private getHistoryDescription(item: any): string {
    if (item.action === 'Created' || item.action === 'Deleted') {
      return item.details || '';
    }
    if (item.field) {
      const formatVal = (v: any) =>
        v === '' || v === null || v === undefined ? 'null' : v;
      return `${item.field}: ${formatVal(item.previousValue)} → ${formatVal(item.currentValue)}`;
    }
    return item.details || 'Instruction was modified';
  }

  public onButtonClick(data: { event: any; fName: string }): void {
    const { event, fName } = data;
    const rawItem: AptitudeInstructionSummary = event?.rawItem || event;
    const action = (fName || '').trim().toLowerCase();

    switch (action) {
      case 'preview':
        this.onPreview(rawItem);
        break;
      case 'new version':
      case 'clone':
        this.onCloneVersion(rawItem);
        break;
      case 'edit':
        this.onEdit(rawItem);
        break;
      case 'delete':
        this.onDelete(rawItem);
        break;
      case 'history':
      case 'view history':
        this.viewHistory(event);
        break;
      default:
        break;
    }
  }

  private openDialog(
    mode: 'create' | 'edit' | 'clone' | 'preview',
    instructionId?: number,
  ): void {
    const dialogData: InstructionDialogData = {
      mode,
      instructionId,
    };

    document.body.style.overflow = 'hidden';
    this.ref = this.dialogService.open(InstructionDialogComponent, {
      data: dialogData,
      header:
        mode === 'preview'
          ? 'Preview Aptitude Test Instructions'
          : mode === 'clone'
            ? 'Clone & Save as New Version'
            : mode === 'edit'
              ? 'Edit Aptitude Test Instructions'
              : 'Create Aptitude Test Instructions',
      width: '92vw',
      height: '90vh',
      maximizable: true,
      modal: true,
      focusOnShow: false,
      styleClass: 'instruction-builder-dialog',
      contentStyle: {
        height: '100%',
        overflow: 'hidden',
        padding: '0',
        display: 'flex',
        'flex-direction': 'column',
      },
      breakpoints: {
        '1400px': '95vw',
        '960px': '98vw',
        '640px': '100vw',
      },
    });

    this.ref.onClose.subscribe((result) => {
      document.body.style.overflow = 'auto';
      if (!result) return;

      if (result.action === 'create') {
        this.createInstruction(result.data);
      } else if (result.action === 'update') {
        this.updateInstruction(result.data.id, result.data);
      } else if (result.action === 'saveAsNewVersion') {
        this.saveAsNewVersion(result.data);
      }
    });
  }

  private createInstruction(payload: CreateAptitudeInstructionRequest): void {
    this.isLoading = true;
    this.instructionService.createInstruction(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Aptitude test instruction created successfully.',
        });
        this.loadInstructions();
      },
      error: (err: any) => {
        this.isLoading = false;
        const backendMsg =
          err?.error?.errorValue ||
          err?.error?.type ||
          err?.error?.message ||
          extractErrorMessage(err, 'Failed to create aptitude test instruction.');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: backendMsg,
        });
        this.cdr.markForCheck();
      },
    });
  }

  private updateInstruction(
    id: number,
    payload: UpdateAptitudeInstructionRequest,
  ): void {
    this.isLoading = true;
    this.instructionService.updateInstruction(id, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Aptitude test instruction updated successfully.',
        });
        this.loadInstructions();
      },
      error: (err: any) => {
        this.isLoading = false;
        const backendMsg =
          err?.error?.errorValue ||
          err?.error?.type ||
          err?.error?.message ||
          extractErrorMessage(err, 'Failed to update aptitude test instruction.');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: backendMsg,
        });
        this.cdr.markForCheck();
      },
    });
  }

  private saveAsNewVersion(payload: SaveAsNewVersionRequest): void {
    this.isLoading = true;
    this.instructionService.saveAsNewVersion(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Saved as new version (v${res.version}) successfully.`,
        });
        this.loadInstructions();
      },
      error: (err: any) => {
        this.isLoading = false;
        const backendMsg =
          err?.error?.errorValue ||
          err?.error?.type ||
          err?.error?.message ||
          extractErrorMessage(err, 'Failed to save new version.');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: backendMsg,
        });
        this.cdr.markForCheck();
      },
    });
  }

  private extractErrorMessage(err: any, fallback: string): string {
    return extractErrorMessage(err, fallback);
  }
}
