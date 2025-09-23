import { PaginatedData } from '../../../../../../shared/models/table.models';
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
import { Panel_URL } from '../../../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { PaginatedPayload } from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../shared/utilities/form.utility';
import { PanelForm } from '../../../../models/panel-form.model';
import { Panel } from '../../../../models/panel.model';
import { PanelService } from '../../../../services/panel.service';
import { PanelDialogComponent } from './components/panel-dialog/panel-dialog.component';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Panel Name',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'description',
      displayName: 'Location/Description',
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
  displayedColumns: [
    'Name',
    'Description',
    'IsActive',
    'IsAssigned',
    'actions',
  ],
};
@Component({
  selector: 'app-panels',
  imports: [TableComponent, Toast, ButtonComponent],
  providers: [TableDataSourceService],
  templateUrl: './panels.component.html',
  styleUrl: './panels.component.scss',
})
export class PanelsComponent implements OnInit, OnDestroy {
  public url = 'summary';
  public data!: PaginatedData<any>;
  public optionsMap = {};
  public columns: TableColumnsData = tableColumns;
  public item!: Panel;
  public fGroup!: FormGroup;
  public PanelFormData = new PanelForm();
  public configMap!: ConfigMap;
  public isLoading = true;
  private currentPayload: PaginatedPayload = new PaginatedPayload();

  private ref: DynamicDialogRef | undefined;

  constructor(
    public dialog: DialogService,
    private panelService: PanelService,
    public messageService: MessageService,
    private dataSourceService: TableDataSourceService<any>,
  ) {
    this.fGroup = buildFormGroup(this.PanelFormData);
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getAllPaginatedPanels(new PaginatedPayload());
    this.setConfigMaps();
  }
  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
  // Public Methods
  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.loadData(payload);
    this.currentPayload = {
      ...payload,
      pagination: {
        ...payload.pagination,
        pageNumber: 1,
      },
    };
  }

  public addNewPanel() {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
    };
    this.ref = this.dialog.open(PanelDialogComponent, {
      data: data,
      header: 'Create Panel',
      width: '50vw',
      modal: true,
      styleClass: 'panel-form',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      if (res) {
        this.CreatePanel(res, false);
      }
      this.fGroup.reset();
    });
  }

  public editPanel(panelData: Panel) {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      formData: panelData,
    };
    this.ref = this.dialog.open(PanelDialogComponent, {
      data: data,
      header: 'Update Panel',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      if (res) {
        this.updatePanel(res);
      }
      this.fGroup.reset();
    });
  }

  public deletePanel(id: number) {
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the panel?',
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
        this.deletePanelItem(id);
      }
      this.fGroup.reset();
    });
  }

  public getAllPaginatedPanels(payload: PaginatedPayload) {
    const next = (res: PaginatedData<any>) => {
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

    this.panelService
      .paginationEntity(`${this.url}`, payload)
      .subscribe({ next, error });
  }

  // Private Methods
  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService
      .getData(payload)
      .subscribe((response: PaginatedData<any>) => {
        this.data = response;
      });
  }

  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${Panel_URL}/${this.url}`);
  }

  private setConfigMaps(): void {
    const { metadata } = new PanelForm();
    this.configMap = metadata.configMap || {};
  }

  private CreatePanel(payload: Panel, action: boolean) {
    this.isLoading = true;
    if (payload) {
      payload.isActive = true;
      payload.name = payload.name.trim().toUpperCase();
    }

    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${action ? 'Duplicated' : 'Created'} Panel Successfully`,
      });

      this.getAllPaginatedPanels(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      if (error?.status === 422 && error?.error?.businessError === 3105) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'This name already exists.',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `${action ? 'Duplication' : 'Creation'} is failed'`,
        });
      }
    };

    this.panelService.createEntity(payload).subscribe({ next, error });
  }

  private updatePanel(payload: Panel) {
    this.isLoading = true;
    payload.name = payload.name.trim().toUpperCase();
    payload.id = payload.id.toString();

    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Updated the Panel Successfully',
      });
      this.getAllPaginatedPanels(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      if (error?.status === 422 && error?.error?.businessError === 3105) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'This name already exists or This panel already exists in interviews',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Updation is failed',
        });
      }
    };
    this.panelService
      .updateEntity(payload.id, payload)
      .subscribe({ next, error });
  }

  private deletePanelItem(id: number) {
    this.isLoading = true;
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deleted the Panel Successfully',
      });
      this.getAllPaginatedPanels(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      console.log('ERROR', error);
      if (error?.status === 422 && error?.error?.businessError === 3105) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'The deletion is not possible.This panel already exists in interviews',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Deletion is failed',
        });
      }
    };
    this.panelService.deleteEntityById(id).subscribe({ next, error });
  }
}
