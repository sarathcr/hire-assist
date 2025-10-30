/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { panelAssignment } from '../../../../../coordinator/models/interview-panels.model';
import { CoordinatorPanelBridgeService } from '../../../../../coordinator/services/coordinator-panel-bridge.service';
import { PanelSummary } from '../../../../models/assessment-schedule.model';
import {
  interviewerFormGroup,
  interviewerInterface,
} from '../../../../models/interviewers-model';
import { AssignInterviewersDialogueComponent } from './components/assign-interviewers-dialogue/assign-interviewers-dialogue.component';

const panelTable: TableColumnsData = {
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
export class InterviewerPanelAssignmentComponent implements OnInit, OnDestroy {
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
  private currentPayload: PaginatedPayload = new PaginatedPayload();

  constructor(
    public dialog: DialogService,
    public messageService: MessageService,
    private coordinatorPanelBridgeService: CoordinatorPanelBridgeService,
    private dataSourceService: TableDataSourceService<any>,
  ) {}

  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.setPanelPaginationEndpoint();
    this.getPaginatedPanelData(new PaginatedPayload());
  }
  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
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
  public getPaginatedPanelData(payload: PaginatedPayload) {
    this.isLoading = true;

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
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(AssignInterviewersDialogueComponent, {
      data: data,
      header: 'Select Interviewer and Panels',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      styleClass: 'interviewerPanels__dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.ref.onClose.subscribe((formData: interviewerResponse) => {
      document.body.style.overflow = 'auto';
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
              this.getPaginatedPanelData(this.currentPayload);
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
              } else if (businerssErrorCode === 3105) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `${error.error.errorValue}`,
                });
              } else if (businerssErrorCode === 3103) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `Cannot assign the interviewers to the panel ${error.error.errorValue}, because the panel is currently assigned to an interview.`,
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Assigning interviewers failed',
                });
              }
              this.isLoading = false;
            },
          });
      }
    });
  }

  public deletePanelAssignment(id: number) {
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the panel Assignment?',
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
      focusOnShow: false,
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
      document.body.style.overflow = 'auto';
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
      this.getPaginatedPanelData(this.currentPayload);
    };

    const error = (error: CustomErrorResponse) => {
      this.isLoading = false;
      const businessErrorCode = error.error.businessError;
      if (businessErrorCode === 3104) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'Cannot delete the panel interviewers as it is used in interview Or the panel interviewers is not exists',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Deletion is failed',
        });
      }
      this.isLoading = false;
    };
    this.coordinatorPanelBridgeService
      .deletePanelAssignments(id)
      .subscribe({ next, error });
  }

  public editPanel(panelData: interviewerInterface): void {
    const formData: interviewerInterface = {
      id: panelData.id,
      panelId: panelData.id,
      interviewers: panelData.interviewers?.map((i: any) => i.id) || [],
    };

    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      formData: formData,
    };

    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(AssignInterviewersDialogueComponent, {
      data,
      header: 'Update Panel Assignment',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      styleClass: 'interviewerPanels__dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((updatedData: interviewerEditResponse) => {
      document.body.style.overflow = 'auto';
      if (updatedData?.panels && updatedData?.interviewers?.length) {
        this.updatePanelAssignment(updatedData);
      } else {
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: 'No updates made to panel interviewers',
        });
      }
    });
  }

  private updatePanelAssignment(payload: interviewerEditResponse): void {
    this.isLoading = true;

    const requestBody: panelAssignment[] = [
      {
        panelId: payload.panels,
        interviewers: payload.interviewers,
      },
    ];

    this.coordinatorPanelBridgeService
      .addInterviewerPanels(requestBody)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.getPaginatedPanelData(this.currentPayload);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Updated interviewers successfully',
          });
        },
        error: (error: CustomErrorResponse) => {
          this.isLoading = false;
          const businessErrorCode = error.error.businessError;
          if (businessErrorCode === 4004) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Panel exists but not activated yet!',
            });
          } else if (businessErrorCode === 3105) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `${error.error.errorValue}`,
            });
          } else if (businessErrorCode === 3103) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail:
                'Cannot update the panel interviewers, because the panel is currently assigned to an interview.',
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update panel interviewers',
            });
          }
        },
      });
  }
}
