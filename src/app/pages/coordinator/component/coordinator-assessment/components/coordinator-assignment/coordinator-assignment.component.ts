/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { MenuItem, MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
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
  InterviewSummary,
  Interviewer,
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
  imports: [
    AccordionModule,
    TableComponent,
    ToastModule,
    CardModule,
    DividerModule,
    BadgeModule,
    ButtonModule,
    ChipModule,
    CommonModule,
  ],
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
  
  // Stepper Properties
  public activeStep = 0;
  public completedSteps: number[] = [];
  public visitedSteps: number[] = [0];
  
  public stepConfig = [
    {
      index: 0,
      label: 'Select Candidate',
      description: 'Choose a candidate to schedule an interview for',
      icon: 'pi pi-user',
    },
    {
      index: 1,
      label: 'Select Panel',
      description: 'Assign an interviewer panel for the candidate',
      icon: 'pi pi-users',
    },
    {
      index: 2,
      label: 'Schedule',
      description: 'Review and confirm the interview schedule',
      icon: 'pi pi-calendar-plus',
    },
  ];
  
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
  public isCandidateLoading = false;
  public isPanelLoading = false;
  public isSchedulingSuccessful = false;
  private lastSelectedPanelId: string | null = null;

  private ref: DynamicDialogRef | undefined;

  constructor(
    public dialog: DialogService,
    public messageService: MessageService,
    private readonly interviewService: InterviewService,
    private readonly coordinatorPanelBridgeService: CoordinatorPanelBridgeService,
    private readonly activatedRoute: ActivatedRoute,
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
    payload.filterMap = {
      AssessmentRoundId: this.assessmentRoundId,
      assessmentId: this.assessmentId,
      ...payload.filterMap,
    };
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

  public selectedCandidate: string[] = [];  // For persistence

  public getSelectedcandidateId(selectedIds: { id: string }[]) {
    this.isSchedulingSuccessful = false;
    if (selectedIds.length > 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Only one candidate can be selected at a time.',
      });
      return;
    }
    // Map IDs to full candidate objects
    if (selectedIds.length > 0 && this.data?.data) {
      const candidate = this.data.data.find((c) => c.id === selectedIds[0].id);
      if (candidate) {
        this.selectedCandidatesIds = [candidate];
        this.selectedCandidate = [String(candidate.id)]; // Persist selection
        this.getInterviewPanel(Number(candidate.id));
      } else {
        this.selectedCandidatesIds = [];
        this.selectedPanel = [];
        this.selectedCandidate = [];
        // Reset stepper state if candidate not found
        this.completedSteps = this.completedSteps.filter(step => step !== 0);
      }
    } else {
      this.selectedCandidatesIds = [];
      this.selectedPanel = [];
      this.selectedCandidate = [];
      // Reset stepper state on deselection
      this.completedSteps = this.completedSteps.filter(step => step !== 0);
      
      // If we are currently on a later step (which shouldn't happen via this method normally, but for safety)
      // logic remains same.
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

  public getSelectedPanelId(selectedIds: { id: string }[]) {
    this.isSchedulingSuccessful = false;
    if (selectedIds.length > 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Only one panel can be selected at a time.',
      });
      return;
    }
    // Map IDs to full panel objects
    if (selectedIds.length > 0) {
      const selectedId = selectedIds[0].id;
      this.lastSelectedPanelId = selectedId;
      // Update selectedPanel array to match the selection
      this.selectedPanel = [selectedId];
      // Try to find panel by matching id (handle both string and number comparison)
      this.updateSelectedPanelFromData(selectedId);
    } else {
      this.selectedPanelIds = [];
      this.selectedPanel = [];
      this.lastSelectedPanelId = null;
    }
  }

  private updateSelectedPanelFromData(panelId: string): void {
    if (this.panelData?.data) {
      const panel = this.panelData.data.find(
        (p) => String(p.id) === String(panelId),
      );
      if (panel) {
        this.selectedPanelIds = [panel];
      }
    }
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

    this.isCandidateLoading = true;
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

          this.isCompleteDisabled = this.data.data.some(
            (candidate: InterviewSummary) =>
              candidate.status === 'Pending' || candidate.isScheduled === false,
          );
          this.isCandidateLoading = false;
        },
        error: () => {
          this.isCandidateLoading = false;
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

    this.isPanelLoading = true;
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
          // If there's a selected panel ID, try to restore the full panel object
          if (this.lastSelectedPanelId) {
            this.updateSelectedPanelFromData(this.lastSelectedPanelId);
          }
          this.isPanelLoading = false;
        },
        error: () => {
          this.isPanelLoading = false;
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
      panel: selectedPanel.panelName,
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
      id: panelData.id ? Number.parseInt(panelData.id, 10) : undefined,
      panelId: panelData.panelId
        ? Number.parseInt(panelData.panelId.toString(), 10)
        : undefined,
      interviewers: panelData.interviewers?.map((i: any) => i.id) ?? [],
      panelName: panelData.panel,
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
      } else if (formData) {
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
                detail: 'Interview panel assigned successfully.',
              });
              this.isSchedulingSuccessful = true;
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
      const payloadInterviewerIds = payload.interviewers
        .slice()
        .sort((a, b) => a.localeCompare(b));
      const interviewInterviewerIds = this.interview.interviewer
        .map((i) => i.id)
        .sort((a, b) => a.localeCompare(b));
      const isInterviewerSame =
        JSON.stringify(payloadInterviewerIds) ===
        JSON.stringify(interviewInterviewerIds);

      const isAlreadyScheduled =
        isInterviewIdSame && isPanelIdSame && isInterviewerSame;
      if (isAlreadyScheduled) {
        this.messageService.add({
          severity: 'info',
          summary: 'Already Exists',
          detail: 'This panel is already scheduled for the candidate.',
        });
        return;
      }
      this.updateInterviewPanels(payload);
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
        this.isSchedulingSuccessful = true;
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
    this.isCandidateLoading = true;
    this.dataSource1.getData(payload).subscribe({
      next: (response: any) => {
        const resData = response.data.map((item: any) => {
          return {
            ...item,
            isScheduled: item.isScheduled ? 'Scheduled' : '',
          };
        });

        this.data = { ...response, data: resData };
        this.isCandidateLoading = false;
      },
      error: () => {
        this.isCandidateLoading = false;
      },
    });
  }
  private loadPanelData(payload: PaginatedPayload): void {
    this.isPanelLoading = true;
    this.dataSource2.getData(payload).subscribe({
      next: (response: any) => {
        const resData = response.data.map((item: any) => {
          return {
            ...item,
            interviewerNames:
              item.interviewers?.map((i: Interviewer) => i.name).join(', ') ??
              '',
            interviewers: item.interviewers ?? [],
          };
        });

        this.panelData = { ...response, data: resData };
        // If there's a selected panel ID, try to restore the full panel object
        if (this.lastSelectedPanelId) {
          this.updateSelectedPanelFromData(this.lastSelectedPanelId);
        }
        this.isPanelLoading = false;
      },
      error: () => {
        this.isPanelLoading = false;
      },
    });
  }
// Stepper Methods

  public setActiveStep(step: number): void {
    if (this.canActivateStep(step)) {
      this.activeStep = step;
      if (!this.visitedSteps.includes(step)) {
        this.visitedSteps.push(step);
      }
    }
  }

  public onNextStep(currentStep: number): void {
    let canProceed = false;

    if (currentStep === 0) {
      if (this.selectedCandidatesIds.length > 0) {
        canProceed = true;
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Please select a candidate to proceed.',
        });
      }
    } else if (currentStep === 1) {
       if (this.selectedPanelIds.length > 0) {
        canProceed = true;
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Please select a panel to proceed.',
        });
      }
    }

    if (canProceed) {
      const nextStep = currentStep + 1;
      this.onCompleteStep(currentStep);
      this.activeStep = nextStep;
      if (!this.visitedSteps.includes(nextStep)) {
        this.visitedSteps.push(nextStep);
      }
    }
  }

  public onCompleteStep(step: number): void {
    if (!this.completedSteps.includes(step)) {
      this.completedSteps.push(step);
    }
  }

  public canActivateStep(step: number): boolean {
    if (step === 0) return true;
    return this.completedSteps.includes(step - 1);
  }

  public getProgressPercentage(): number {
    const totalSteps = this.stepConfig.length;
    // Count steps that are completed (in completedSteps array)
    // Note: completedSteps includes 0 initially, so logic might need adjustment depending on how we want to show 0%
    // If we want "Select Candidate" to be 0% complete until selected, we check logic.
    // Let's assume progress based on completed steps count / total steps
    // But we want visual progress.
    // If active step is 0, progress 0%. If active 1, progress 33%.
    // Matches assessment-view logic:
    const stepsCompletedCount = this.completedSteps.filter(s => s < this.stepConfig.length).length;
    // However, assessment-view used API status keys. Here we use local state.
    // Let's base it on active step index for linear progression visualization or completed count.
    // assessment-view: Math.round((completedSteps / totalSteps) * 100);
    
    // Adjust for our 0-based index and simple linear flow
    // If we completed step 0 (selected candidate), we have 1/3 done?
    // Let's use logic: (activeStep / (totalSteps -1)) * 100 ??
    // Or just strictly based on completed steps.
    return Math.round((this.completedSteps.length / totalSteps) * 100); 
  }

  public isStepEnabled(stepIndex: number): boolean {
      return this.canActivateStep(stepIndex);
  }
}
