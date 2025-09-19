/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Toast } from 'primeng/toast';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { INTERVIEW_URL } from '../../../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import {
  FilterMap,
  PaginatedPayload,
} from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { ConfigMap } from '../../../../../../shared/utilities/form.utility';
import { CoordinatorPanelBridgeService } from '../../../../../coordinator/services/coordinator-panel-bridge.service';
import { PanelSummary } from '../../../../models/assessment-schedule.model';
import {
  interviewerFormGroup,
  interviewerInterface,
  InterviewerPanelAssignment,
} from '../../../../models/interviewers-model';
import { AssignInterviewersDialogueComponent } from './components/assign-interviewers-dialogue/assign-interviewers-dialogue.component';
import { panelAssignment } from '../../../../../coordinator/models/interview-panels.model';

const panelTable: TableColumnsData = {
  columns: [
    {
      field: 'panelName',
      displayName: 'Panel Name',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'interviewerNames',
      displayName: 'Interviewers',
      sortedColumn: true,
      hasChip: false,
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

export interface interviewerResponse {
  id?: number;
  panels: number;
  interviewers: string[];
}
export interface interviewerEditResponse {
  id?: number;
  panels: number;
  interviewers: string[];
}
@Component({
  selector: 'app-interviewer-panel-assignment',
  imports: [TableComponent, ButtonComponent, Toast],
  providers: [TableDataSourceService],
  templateUrl: './interviewer-panel-assignment.component.html',
  styleUrl: './interviewer-panel-assignment.component.scss',
})
export class InterviewerPanelAssignmentComponent implements OnInit {
  public panelData!: any;
  public selectedPanelIds: PanelSummary[] = [];
  public panelColumn: TableColumnsData = panelTable;
  public filterMap!: FilterMap;
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;
  public isCompleteDisabled = false;
  private ref: DynamicDialogRef | undefined;
  public interviewersData!: interviewerFormGroup[];
  public isLoading = true;

  constructor(
    public dialog: DialogService,
    public messageService: MessageService,
    private coordinatorPanelBridgeService: CoordinatorPanelBridgeService,
    private dataSourceService: TableDataSourceService<any>,
  ) {}

  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.setPanelPaginationEndpoint();
    this.getPaginatedPanelData();
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.loadData(payload);
  }
  public getPaginatedPanelData() {
    this.isLoading = true;
    const payload = {
      multiSortedColumns: [],
      filterMap: {},
      pagination: {
        pageNumber: 1,
        pageSize: 5,
      },
    };

    this.coordinatorPanelBridgeService
      .paginationEntity('panel/activePanelSummary', payload)
      .subscribe({
        next: (res: any) => {
          const resData = res.data.map((item: PanelSummary) => {
            return {
              ...item,
              interviewerNames:
                item.interviewers?.map((i) => i.name).join(', ') ?? '',
              interviewers: item.interviewers ?? [],
            };
          });
          this.panelData = { ...res, data: resData };

          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error in getting Panel Details.',
          });
        },
      });
  }

  public createInterviewerPanel(): void {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
    };
    this.ref = this.dialog.open(AssignInterviewersDialogueComponent, {
      data: data,
      header: 'Select Interviewer and Panels',
      width: '50vw',
      modal: true,
      styleClass: 'interviewerPanels__dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.ref.onClose.subscribe((formData: interviewerResponse) => {
      if (formData?.panels && formData?.interviewers?.length) {
        this.isLoading = true;
        const payload: panelAssignment[] = [
          {
            panelId: formData.panels,
            interviewers: formData.interviewers,
          },
        ];
        this.coordinatorPanelBridgeService
          .addInterviewerPanels(payload)
          .subscribe({
            next: () => {
              this.isLoading = false;
              this.getPaginatedPanelData();
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Assigned interviewers',
              });
            },

            error: (error: CustomErrorResponse) => {
              const businerssErrorCode = error.error.businessError;
              if (businerssErrorCode === 4004) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Panel is already exists but not actived yet!',
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Interviewer not created',
                });
              }
              this.isLoading = false;
            },
          });
      }
    });
  }

  public getByIdPanel(data: number | any) {
    this.coordinatorPanelBridgeService
      .getinterviewPanlesAssignment(data.id)
      .subscribe({
        next: (res: InterviewerPanelAssignment[]) => {
          if (res) {
            this.editPanel(res);
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error in getting data',
          });
        },
      });
  }

  public deletePanelAssignment(id: number) {
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the panel Assignment?',
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
        this.isLoading = true;
        this.deletePanelAssignmentById(id);
      }
    });
  }

  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${INTERVIEW_URL}/InterviewSummary`);
  }
  private setPanelPaginationEndpoint() {
    this.dataSourceService.setEndpoint(
      `${INTERVIEW_URL}/panel/activePanelSummary`,
    );
  }

  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService.getData(payload).subscribe((response: any) => {
      const resData = response.data.map((item: PanelSummary) => {
        return {
          ...item,
          interviewerNames:
            item.interviewers?.map((i) => i.name).join(', ') ?? '',
          interviewers: item.interviewers ?? [],
        };
      });
      this.panelData = { ...response, data: resData };
    });
  }

  private deletePanelAssignmentById(id: number) {
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deleted the Panel Assignment Successfully',
      });
      this.isLoading = false;
      this.getPaginatedPanelData();
      console.log('delete panel called');
    };

    const error = () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Deletion is failed',
      });
      this.isLoading = false;
    };
    this.coordinatorPanelBridgeService
      .deletePanelAssignments(id)
      .subscribe({ next, error });
  }
  private editPanel(panelData: InterviewerPanelAssignment[]) {
    const formData: interviewerInterface = {
      id: panelData[0].id,
      panelId: panelData[0].panelId,
      interviewers: panelData.map((p) => p.interviewerId),
    };

    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      formData: formData,
    };

    this.ref = this.dialog.open(AssignInterviewersDialogueComponent, {
      data: data,
      header: 'Update Panel',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.ref.onClose.subscribe((formData: interviewerEditResponse) => {
      if (formData?.panels && formData?.interviewers?.length) {
        this.isLoading = true;
        const payload: panelAssignment[] = [
          {
            panelId: formData.panels,
            interviewers: formData.interviewers,
          },
        ];
        this.coordinatorPanelBridgeService
          .addInterviewerPanels(payload)
          .subscribe({
            next: () => {
              this.isLoading = false;
              this.getPaginatedPanelData();
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Updated interviewers into panels',
              });
            },
            error: (error: CustomErrorResponse) => {
              const businerssErrorCode = error.error.businessError;
              if (businerssErrorCode === 4004) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Panel is already exists but not actived yet!',
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'interviewers are not updated to Panels',
                });
              }
              this.isLoading = false;
            },
          });
      } else {
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: 'interviewers are not updated to Panels',
        });
      }
    });
  }
}
