/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Toast } from 'primeng/toast';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { BATCH_URL } from '../../../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { PaginatedPayload } from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedData,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { StoreService } from '../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../shared/utilities/form.utility';
import { BatchForm } from '../../../../models/batch-form.model';
import { Batch } from '../../../../models/batch.model';
import { BatchService } from '../../../../services/batch.service';
import { BatchDialogComponent } from './components/batch-dialog/batch-dialog.component';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'title',
      displayName: 'Title',
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
  displayedColumns: ['title', 'descriptionNew', 'active', 'actions'],
};
@Component({
  selector: 'app-batches',
  imports: [TableComponent, Toast, ButtonComponent],
  providers: [TableDataSourceService],
  templateUrl: './batches.component.html',
  styleUrl: './batches.component.scss',
})
export class BatchesComponent implements OnInit, OnDestroy {
  public url = 'Batchsummary';
  public data!: PaginatedData<any>;
  public optionsMap = {};
  public columns: TableColumnsData = tableColumns;
  public item!: Batch;
  public fGroup!: FormGroup;
  public batchFormData = new BatchForm();
  public configMap!: ConfigMap;
  public isLoading = true;
  private currentPayload: PaginatedPayload = new PaginatedPayload();

  private ref: DynamicDialogRef | undefined;

  constructor(
    public dialog: DialogService,
    private batchService: BatchService,
    public messageService: MessageService,
    private storeService: StoreService,
    private dataSourceService: TableDataSourceService<any>,
  ) {
    this.fGroup = buildFormGroup(this.batchFormData);
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getAllPaginatedBatches(new PaginatedPayload());
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

  public addNewBatch() {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
    };
    this.ref = this.dialog.open(BatchDialogComponent, {
      data: data,
      header: 'Create Batch',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      if (res) {
        this.CreateBatch(res, false);
      }
      this.fGroup.reset();
    });
  }

  public editBatch(batchData: Batch) {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      formData: batchData,
    };
    this.ref = this.dialog.open(BatchDialogComponent, {
      data: data,
      header: 'Update Batch',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      if (res) {
        this.updateBatch(res);
      }
      this.fGroup.reset();
    });
  }

  public deleteBatch(id: number) {
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the batch?',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };

    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '25vw',
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
        this.deleteBatchItem(id);
      }
      this.fGroup.reset();
    });
  }

  public getAllPaginatedBatches(payload: PaginatedPayload) {
    this.isLoading = true;
    const next = (res: any) => {
      if (res) {
        this.data = res;
      }
      this.isLoading = false;
    };

    const error = (error: CustomErrorResponse) => {
      console.log('ERROR', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error : ${error.error.type}`,
      });
      this.isLoading = false;
    };

    this.batchService
      .paginationEntity(`/${this.url}`, payload)
      .subscribe({ next, error });
  }

  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService.getData(payload).subscribe((response: any) => {
      this.data = response;
    });
  }

  // Private Methods
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${BATCH_URL}/${this.url}`);
  }

  private setConfigMaps(): void {
    const { metadata } = new BatchForm();
    this.configMap = metadata.configMap || {};
  }

  private CreateBatch(payload: Batch, action: boolean) {
    this.isLoading = true;
    if (payload) {
      payload.isActive = true;
      payload.title = payload.title.trim();
    }

    const next = () => {
      this.storeService.setIsLoading(false);
      this.isLoading = false;
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${action ? 'Duplicated' : 'Created'} Batch Successfully`,
        });
      }, 200);
      this.getAllPaginatedBatches(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      if (error?.status === 422 && error?.error?.businessError === 3105) {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `${error.error.errorValue}`,
        });
      } else {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `${action ? 'Duplication' : 'Creation'} is failed`,
        });
      }
    };

    this.batchService.createEntity(payload).subscribe({ next, error });
  }

  private updateBatch(payload: Batch) {
    this.isLoading = true;
    payload.title = payload.title.trim();

    const next = () => {
      this.storeService.setIsLoading(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Updated the Batch Successfully',
      });

      this.getAllPaginatedBatches(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      this.storeService.setIsLoading(false);
      if (error?.status === 422 && error?.error?.businessError === 3107) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'This title already exists.',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Updation is failed',
        });
      }
    };
    this.batchService.updateEntity('', payload).subscribe({ next, error });
  }

  private deleteBatchItem(id: number) {
    this.isLoading = true;
    const next = () => {
      this.storeService.setIsLoading(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deleted the Batch Successfully',
      });
      this.getAllPaginatedBatches(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      this.storeService.setIsLoading(false);
      this.isLoading = false;
      if (
        error?.status === 422 &&
        (error?.error?.businessError === 5003 ||
          error?.error?.businessError === 3108)
      ) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'The deletion is not possible. It already exists in assessments.',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Deletion is failed',
        });
      }
    };
    this.batchService.deleteEntityById(id).subscribe({ next, error });
  }
}
