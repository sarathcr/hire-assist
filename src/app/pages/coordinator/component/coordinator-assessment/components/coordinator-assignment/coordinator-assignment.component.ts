/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { MenuItem, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { INTERVIEW_URL } from '../../../../../../shared/constants/api';
import { StatusEnum } from '../../../../../../shared/enums/status.enum';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import {
  FilterMap,
  PaginatedData,
  PaginatedPayload,
} from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { ConfigMap } from '../../../../../../shared/utilities/form.utility';
import { InterviewService } from '../../../../../admin/components/assessment/services/interview.service';
import { AssignInterviewersDialogueComponent } from '../../../../../admin/components/settings/components/interviewer-panel-assignment/components/assign-interviewers-dialogue/assign-interviewers-dialogue.component';
import { interviewerEditResponse } from '../../../../../admin/components/settings/components/interviewer-panel-assignment/interviewer-panel-assignment.component';
import {
  Interviewer,
  InterviewSummary,
  PanelSummary,
} from '../../../../../admin/models/assessment-schedule.model';
import { Interview } from '../../../../../admin/models/interviewer.model';
import { interviewerInterface } from '../../../../../admin/models/interviewers-model';
import {
  GetInterviewPanelsResponse,
  InterviewPanels,
  InterviewPanelsResponse,
} from '../../../../models/interview-panels.model';
import { CoordinatorPanelBridgeService } from '../../../../services/coordinator-panel-bridge.service';

const candidateTable: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Candidate Name',
      sortedColumn: false,
      hasChip: false,
    },
    {
      field: 'status',
      displayName: 'Status',
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: [],
};

export const CANDIDATE_TABLE = 'CANDIDATE_TABLE';
export const PANEL_TABLE = 'PANEL_TABLE';
const panelTable: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Panel Name',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'panelDescription',
      displayName: 'Description',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'interviewerNames',
      displayName: 'Interviewers',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'status',
      displayName: 'Status',
      sortedColumn: false,
      hasChip: false,
    },
    {
      field: 'actions',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      actions: [PaginatedDataActions.Edit],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: [],
};

type payload = Record<string, any>;

@Component({
  selector: 'app-coordinator-assignment',
  imports: [AccordionModule, TableComponent, ButtonComponent, ToastModule],
  providers: [
    TableDataSourceService,
    MessageService,
    { provide: CANDIDATE_TABLE, useClass: TableDataSourceService },
    { provide: PANEL_TABLE, useClass: TableDataSourceService },
  ],
  templateUrl: './coordinator-assignment.component.html',
  styleUrl: './coordinator-assignment.component.scss',
})
export class CoordinatorAssignmentComponent implements OnInit {
  // Public Properties

  public data!: PaginatedData<InterviewSummary>;
  public panelData!: PaginatedData<PanelSummary>;
  public sidebarConfig!: MenuItem[];
  public selectedView: 0 | 1 = 0;
  public selectedCandidatesIds: InterviewSummary[] = [];
  public selectedPanelIds: PanelSummary[] = [];
  public candidateColumn: TableColumnsData = candidateTable;
  public panelColumn: TableColumnsData = panelTable;
  public isCompleteDisabled = false;
  public candidateTableFilterMap!: FilterMap;
  public panelTableFilterMap!: FilterMap;
  public interview!: GetInterviewPanelsResponse;
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;
  public assessmentId!: number;
  public assessmentRoundId!: number;
  public selectedPanel: string[] = [];
  public existingPanel: string[] = [];
  public updateInterview!: Interview;
  public combinedPayloadData: any;

  private ref: DynamicDialogRef | undefined;

  constructor(
    public dialog: DialogService,
    public messageService: MessageService,
    private readonly interviewService: InterviewService,
    private readonly coordinatorPanelBridgeService: CoordinatorPanelBridgeService,
    private activatedRoute: ActivatedRoute,
    @Inject('CANDIDATE_TABLE') public dataSource1: TableDataSourceService<any>,
    @Inject('PANEL_TABLE') public dataSource2: TableDataSourceService<any>,
  ) {}

  // LifeCycle Hooks

  ngOnInit(): void {
    this.assessmentId = Number(
      this.activatedRoute.snapshot.paramMap.get('recruitmentId'),
    );
    this.assessmentRoundId = Number(
      this.activatedRoute.snapshot.paramMap.get('assessmentRoundId'),
    );
    this.setPaginationEndpoint();
    this.setPanelPaginationEndpoint();
    const payload: payload = { AssessmentRoundId: this.assessmentRoundId };
    this.combinedPayloadData = {
      ...payload,
      assessmentId: this.assessmentId,
    };
    this.getPaginatedCandidateData(this.combinedPayloadData);
    this.getPaginatedPanelData();
  }

  // Public Methods

  public onTablePayloadChange(payload: PaginatedPayload): void {
    if (this.candidateTableFilterMap) {
      this.candidateTableFilterMap = {
        AssessmentRoundId: this.assessmentRoundId,
      };
      payload.filterMap = {
        ...this.candidateTableFilterMap,
        ...payload.filterMap,
      };
    }
    this.loadCandidateData(payload);
  }

  public onPanelTablePayloadChange(payload: PaginatedPayload): void {
    if (this.panelTableFilterMap && payload) {
      this.panelTableFilterMap = { AssessmentId: this.assessmentId };
      payload.filterMap = {
        ...this.panelTableFilterMap,
        ...payload.filterMap,
      };
    }
    this.loadPanelData(payload);
  }

  public getSelectedcandidateId(selectedIds: InterviewSummary[]) {
    if (selectedIds.length > 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Only one candidate can be selected at a time.',
      });
      return;
    }
    this.selectedCandidatesIds = selectedIds.map(
      (item: InterviewSummary) => item,
    );
    if (this.selectedCandidatesIds.length > 0) {
      this.getInterviewPanel(Number(this.selectedCandidatesIds[0].id));
    } else {
      this.selectedPanel = [];
    }
  }
  public getInterviewPanel(InterviewId: number) {
    this.coordinatorPanelBridgeService
      .getinterviewPanles(InterviewId.toString())
      .subscribe({
        next: (res: GetInterviewPanelsResponse) => {
          this.selectedPanel = [String(res.panelId)];
        },
      });
  }

  public getSelectedPanelId(selectedIds: PanelSummary[]) {
    if (selectedIds.length > 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Only one panel can be selected at a time.',
      });
      return;
    }
    this.selectedPanelIds = selectedIds.map((item: PanelSummary) => item);
  }

  public getPaginatedCandidateData(data: payload) {
    const payload = {
      multiSortedColumns: [],
      filterMap: data || {},
      pagination: {
        pageNumber: 1,
        pageSize: 5,
      },
    };

    this.interviewService
      .paginationEntity('InterviewSummary', payload)
      .subscribe({
        next: (res: any) => {
          const resData = res.data.map((item: InterviewSummary) => {
            return {
              ...item,
              isScheduled: item.isScheduled ? 'Scheduled' : '',
            };
          });

          this.data = { ...res, data: resData };

          this.isCompleteDisabled =
            this.data.data.length !== 0 &&
            this.data.data.some(
              (candidate: InterviewSummary) =>
                candidate.status === 'Pending' ||
                candidate.isScheduled === false,
            );
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error in getting Candidate Details.',
          });
        },
      });
  }

  public getPaginatedPanelData() {
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
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error in getting Panel Details.',
          });
        },
      });
  }

  public schedule() {
    if (!this.selectedCandidatesIds.length || !this.selectedPanelIds.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select at least one candidate and one panel.',
      });
      return;
    }

    const selectedCandidate = this.selectedCandidatesIds[0];
    const selectedPanel = this.selectedPanelIds[0];
    const selectedInterviewerIds =
      selectedPanel.interviewers?.map((i: any) => i.id) ?? [];

    const payload: InterviewPanels = {
      assessmentId: this.assessmentId,
      interviewId: Number(selectedCandidate.id),
      panelId: selectedPanel.id,
      interviewers: selectedInterviewerIds,
    };
    this.getInterviewPanels(selectedCandidate.id, payload);
  }

  public editPanel(panelData: InterviewPanels) {
    this.fGroup?.get('panels')?.setValidators(Validators.required);
    this.fGroup?.get('panels')?.updateValueAndValidity();

    const normalizedFormData: interviewerInterface = {
      id: panelData.id ? parseInt(panelData.id) : undefined,
      panelId: panelData.id ? parseInt(panelData.id) : undefined,
      interviewers: panelData.interviewers?.map((i: any) => i.id) ?? [],
      panelName: panelData.panelName,
    };
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      formData: normalizedFormData,
      isEdit: true,
    };
    this.ref = this.dialog.open(AssignInterviewersDialogueComponent, {
      data: data,
      header: 'Update Panel',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((formData: interviewerEditResponse) => {
      if (formData?.panels && formData?.interviewers?.length) {
        const payload = [
          {
            panelId: formData.panels,
            interviewers: formData.interviewers,
          },
        ];

        this.coordinatorPanelBridgeService
          .addInterviewerPanels(payload)
          .subscribe({
            next: () => {
              this.getPaginatedPanelData();
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Updated interviewers into panels',
              });
            },
            error: (error: CustomErrorResponse) => {
              const businerssErrorCode = error.error.businessError;
              if (businerssErrorCode === 3105) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: error.error.errorValue,
                });
              }
              this.getPaginatedPanelData();
            },
          });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'interviewers are not updated to Panels',
        });
      }
    });
  }

  // Private Methods

  private addInterviewPanels(payload: InterviewPanels): void {
    this.interviewService.addinterviewpanel(payload).subscribe({
      next: () => {
        this.updateInterview = {
          id: Number(this.selectedCandidatesIds[0].id),
          statusId: StatusEnum.Scheduled,
        };
        this.interviewService
          .UpdateInterview(
            Number(this.selectedCandidatesIds[0].id),
            this.updateInterview,
          )
          .subscribe({
            next: () => {
              this.getPaginatedCandidateData(this.combinedPayloadData);
              this.getPaginatedPanelData();
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Interview panel added successfully.',
              });
            },
          });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add interview panel.',
        });
      },
    });
  }

  private getInterviewPanels(
    selectedCandidate: string,
    payload: InterviewPanels,
  ): void {
    const next = (response: GetInterviewPanelsResponse) => {
      this.interview = response ?? {};
      const isInterviewIdSame =
        payload.interviewId === this.interview.interviewId;
      const isPanelIdSame = payload.panelId === this.interview.panelId;
      const isInterviewerSame =
        JSON.stringify(payload.interviewers.sort()) ===
        JSON.stringify(this.interview.interviewer.sort());

      const isAlreadyScheduled =
        isInterviewIdSame && isPanelIdSame && isInterviewerSame;
      if (isAlreadyScheduled) {
        this.messageService.add({
          severity: 'info',
          summary: 'Already Exists',
          detail: 'This panel is already scheduled for the candidate.',
        });
        return;
      } else {
        this.updateInterviewPanels(payload);
      }
    };

    const error = (error: HttpErrorResponse) => {
      if (error?.status === 422 && error?.error?.businessError === 3102) {
        this.addInterviewPanels(payload);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to get interview panels.`,
        });
      }
    };

    this.coordinatorPanelBridgeService
      .getinterviewPanles(selectedCandidate)
      .subscribe({ next, error });
  }
  private updateInterviewPanels(payload: InterviewPanels): void {
    const payloaddata: InterviewPanelsResponse = {
      assessmentId: this.assessmentId,
      interviewId: Number(payload.interviewId),
      panel: this.selectedPanelIds[0].panelName,
      interviewer: payload.interviewers,
    };
    this.interviewService.updateinterviewpanel(payloaddata).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Interview panel Updated successfully.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to Update interview panel.',
        });
      },
    });
  }

  private setPaginationEndpoint() {
    this.dataSource1.setEndpoint(`${INTERVIEW_URL}/InterviewSummary`);
  }

  private setPanelPaginationEndpoint() {
    this.dataSource2.setEndpoint(`${INTERVIEW_URL}/panel/activePanelSummary`);
  }

  private loadCandidateData(payload: PaginatedPayload): void {
    this.dataSource1.getData(payload).subscribe((response: any) => {
      const resData = response.data.map((item: any) => {
        return {
          ...item,
          isScheduled: item.isScheduled ? 'Scheduled' : '',
        };
      });

      this.data = { ...response, data: resData };
    });
  }
  private loadPanelData(payload: PaginatedPayload): void {
    this.dataSource2.getData(payload).subscribe((response: any) => {
      const resData = response.data.map((item: any) => {
        return {
          ...item,
          interviewerNames:
            item.interviewers?.map((i: Interviewer) => i.name).join(', ') ?? '',
          interviewers: item.interviewers ?? [],
        };
      });

      this.panelData = { ...response, data: resData };
    });
  }
}
