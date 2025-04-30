/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Toast } from 'primeng/toast';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import {
  FieldType,
  PaginatedData,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../shared/utilities/form.utility';
import { BatchForm } from '../../../../models/batch-form.model';
import { Batch } from '../../../../models/batch.model';
import { MessageService } from 'primeng/api';
import { StoreService } from '../../../../../../shared/services/store.service';
import { BatchService } from '../../../../services/batch.service';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { BATCH_URL } from '../../../../../../shared/constants/api';
import { PaginatedPayload } from '../../../../../../shared/models/pagination.models';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { BatchDialogComponent } from './components/batch-dialog/batch-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'title',
      displayName: 'Title',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'descriptionNew',
      displayName: 'Description',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'active',
      displayName: 'Active',
      sortedColumn: true,
      hasChip: false,
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
  imports: [TableComponent, Toast],
  providers: [TableDataSourceService],
  templateUrl: './batches.component.html',
  styleUrl: './batches.component.scss',
})
export class BatchesComponent implements OnInit {
  public url = 'Batchsummary';
  public data!: PaginatedData<any>;
  public optionsMap = {};
  public columns: TableColumnsData = tableColumns;
  public item!: Batch;
  public fGroup!: FormGroup;
  public batchFormData = new BatchForm();
  public configMap!: ConfigMap;
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

  // Public Methods
  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.loadData(payload);
  }

  public addNewBatch() {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
    };

    console.log('Data', data);

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
      message: 'Are you sure you want to to delete the batch?',
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
        this.deleteBatchItem(id);
      }
      this.fGroup.reset();
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

  private getAllPaginatedBatches(payload: PaginatedPayload) {
    const next = (res: any) => {
      if (res) {
        this.data = res;
      }
    };

    const error = (error: CustomErrorResponse) => {
      console.log('ERROR', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error : ${error.error.type}`,
      });
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

  private CreateBatch(payload: Batch, action: boolean) {
    if (payload.isActive == null) {
      payload.isActive = false;
    }
    payload.title = payload.title.trim();

    const next = () => {
      this.storeService.setIsLoading(false);
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${action ? 'Duplicated' : 'Created'} Batch Successfully`,
        });
      }, 200);
      this.getAllPaginatedBatches(new PaginatedPayload());
    };

    const error = (error: string) => {
      this.storeService.setIsLoading(false);
      console.log('ERROR', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `${action ? 'Duplication' : 'Creation'} is failed'`,
      });
    };

    this.batchService.createEntity(payload).subscribe({ next, error });
  }

  private updateBatch(payload: Batch) {
    payload.title = payload.title.trim();

    const next = () => {
      this.storeService.setIsLoading(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Updated the Batch Successfully',
      });
      this.getAllPaginatedBatches(new PaginatedPayload());
    };

    const error = (error: HttpErrorResponse) => {
      this.storeService.setIsLoading(false);
      console.log('ERROR', error);
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
    const next = () => {
      this.storeService.setIsLoading(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deleted the Batch Successfully',
      });
      this.getAllPaginatedBatches(new PaginatedPayload());
    };

    const error = (error: HttpErrorResponse) => {
      this.storeService.setIsLoading(false);
      console.log('ERROR', error);
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
