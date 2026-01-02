/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { StepperModule } from 'primeng/stepper';
import { Toast } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
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
import { recruitment } from '../../../../../../shared/models/stepper.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import {
  GetInterviewPanelsResponse,
  InterviewPanels,
  InterviewPanelsResponse,
} from '../../../../../coordinator/models/interview-panels.model';
import { CoordinatorPanelBridgeService } from '../../../../../coordinator/services/coordinator-panel-bridge.service';
import {
  InterviewSummary,
  PanelSummary,
} from '../../../../models/assessment-schedule.model';
import {
  Assessment,
  AssessmentRound,
} from '../../../../models/assessment.model';
import {
  CandidateData,
  CandidatePayload,
} from '../../../../models/stepper.model';
import { AssessmentService } from '../../../../services/assessment.service';
import { InterviewService } from '../../services/interview.service';
import { finalize } from 'rxjs/operators';
import { PaginatedData } from './../../../../../../shared/models/pagination.models';
import { ScheduleInterviewComponent } from './components/schedule-interview/schedule-interview.component';
import { SelectPanelDailogComponent } from './components/select-panel-dailog/select-panel-dailog.component';

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
      field: 'email',
      displayName: 'Email',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'score',
      displayName: 'Score',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'scoreFilter',
    },
    {
      field: 'status',
      displayName: 'Status',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'statusFilter',
      hasMultiStatus: true,
    },
    {
      field: 'isScheduled',
      displayName: 'Proceed to Next Round',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'statusFilter',
      hasMultiStatus: false,
    },
    {
      field: 'scheduledDate',
      displayName: 'Interview Date',
      sortedColumn: true,
      hasChip: false,
      fieldType: FieldType.StringToDate,
    },
    {
      field: 'actions',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      actions: [PaginatedDataActions.View, PaginatedDataActions.Delete],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: [],
};

export interface AssesmentRoundResponse {
  id: number;
  name: string;
  email: string;
  score: string;
  status: string;
  assessmentRoundId: number;
}

@Component({
  selector: 'app-assessment-detail',
  imports: [
    CommonModule,
    SkeletonModule,
    StepperModule,
    ButtonModule,
    TableComponent,
    ButtonComponent,
    Toast,
    NgClass,
    TooltipModule,
  ],
  providers: [TableDataSourceService],
  templateUrl: './assessment-detail.component.html',
  styleUrl: './assessment-detail.component.scss',
})
export class AssessmentDetailComponent implements OnInit, OnDestroy {
  public assessmentId!: number;
  public sidebarConfig!: MenuItem[];
  public data!: Assessment;
  public tableData!: PaginatedData<CandidateData>;
  public columns: TableColumnsData = tableColumns;
  public step!: AssessmentRound[];
  public stepperConfig!: recruitment[];
  public currentStep!: number;
  public selectedCandidates: InterviewSummary[] = [];
  public isCompleteDisabled = false;
  public assessmentRoundList!: AssessmentRound[] | null;
  public filterMap!: FilterMap;
  public activeMenuItem = 0;
  public activeMenuItemIndex = 0;
  public roundStatus = false;
  public interview!: GetInterviewPanelsResponse;
  public selectedPanels!: PanelSummary;
  public isLoading = false;

  private nextRoundId!: number | null;
  private candidatePanelAssignments = new Map<string, boolean>();

  private ref: DynamicDialogRef | undefined;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly assessmentService: AssessmentService,
    private messageService: MessageService,
    private interviewService: InterviewService,
    private dataSourceService: TableDataSourceService<InterviewSummary>,
    private messagesService: MessageService,
    public dialog: DialogService,
    public interviewservice: InterviewService,
    private readonly coordinatorPanelBridgeService: CoordinatorPanelBridgeService,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    const routeId = this.activatedRoute.snapshot.paramMap.get('id');
    if (routeId) {
      this.assessmentId = Number(routeId);
      this.getAssessmentDetails(this.assessmentId);
      this.getAssessmentRoundDetails(this.assessmentId);
    }
    this.setSidebarConfig();
    this.setPaginationEndpoint();
  }
  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
  // Public Methods

  public getSelectedCandidatesOnTable(selectedIds: { id: string }[]) {
    // Map selected IDs to full candidate objects from tableData
    // The table component emits only { id } objects, so we need to look up the full data
    this.selectedCandidates = selectedIds
      .map((selected) => {
        const fullCandidate = this.tableData?.data?.find(
          (candidate) => String(candidate.id) === String(selected.id),
        );
        if (fullCandidate) {
          // Map CandidateData to InterviewSummary format
          return {
            id: fullCandidate.id,
            name: fullCandidate.name,
            email: fullCandidate.email,
            score: Number(fullCandidate.score) || 0,
            status: fullCandidate.status,
            isScheduled: fullCandidate.isScheduled === 'Scheduled',
            scheduledDate: fullCandidate.scheduledDate
              ? new Date(fullCandidate.scheduledDate)
              : new Date(),
            assessmentRoundId: fullCandidate.assessmentRoundId,
          } as InterviewSummary;
        }
        return undefined;
      })
      .filter(
        (candidate): candidate is InterviewSummary => candidate !== undefined,
      );
  }

  public deleteCandidate(id: string) {
    this.openDeleteCandidateConfirmationModal(id);
  }

  public onView(data: CandidateData): void {
    this.router.navigate([
      'admin/recruitments/candidateDetail',
      this.assessmentId,
      data.id,
    ]);
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    if (this.filterMap) {
      payload.filterMap = {
        ...this.filterMap,
        ...payload.filterMap,
      };
    }

    this.loadData(payload);
  }

  public rejectCandidate() {
    const assessmentRoundId = Number(this.currentStep);

    const name = 'rejected';
    if (this.selectedCandidates.length != 0) {
      const modalData: DialogData = {
        message: `Are you sure you want to reject the candidates?`,
        isChoice: true,
        cancelButtonText: 'Cancel',
        acceptButtonText: 'Reject',
      };
      this.ref = this.dialog.open(DialogComponent, {
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
        if (result) {
          if (this.selectedCandidates.length) {
            const payload: CandidatePayload[] = this.selectedCandidates.map(
              (candidate: InterviewSummary): CandidatePayload => {
                return {
                  candidateId: String(candidate.email),
                  assessmentRoundId: Number(assessmentRoundId),
                  isActive: true,
                  statusId: 9,
                  assessmentId: this.assessmentId,
                };
              },
            );
            this.UpdateCandidateStatus(payload, name);
          }
        }
      });
    } else {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No selected Candidate to reject.',
      });
    }
  }

  public selectCandidate() {
    const name = 'selected';
    if (this.selectedCandidates.length != 0) {
      const modalData: DialogData = {
        message: `Are you sure you want to select the candidates?`,
        isChoice: true,
        cancelButtonText: 'Cancel',
        acceptButtonText: 'Select',
      };
      this.ref = this.dialog.open(DialogComponent, {
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
        if (result) {
          if (this.selectedCandidates.length) {
            const payload: CandidatePayload[] = this.selectedCandidates.map(
              (candidate: InterviewSummary): CandidatePayload => {
                return {
                  candidateId: String(candidate.email),
                  assessmentRoundId: this.currentStep,
                  isActive: true,
                  statusId: 8,
                  assessmentId: this.assessmentId,
                };
              },
            );
            this.UpdateCandidateStatus(payload, name);
          }
        }
      });
    } else {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No selected Candidate to mark as select.',
      });
    }
  }

  public onStepChange(step: number, status?: string) {
    this.currentStep = step;
    this.roundStatus = status === 'Completed';
    this.filterMap = { assessmentRoundId: step };
    // Clear panel assignment cache when round changes
    this.candidatePanelAssignments.clear();
    this.getPaginatedCandidateData(this.filterMap);
  }

  /**
   * Checks if the Assign Panel button should be enabled
   * Enabled when at least one candidate is selected and all selected candidates have status "Selected" or "Rejected"
   * Note: OnPanelClick only supports assigning one candidate at a time, but button enables for multiple
   */
  public isAssignPanelEnabled(): boolean {
    // Must have at least one candidate selected
    if (!this.selectedCandidates || this.selectedCandidates.length === 0) {
      return false;
    }

    // Check if all selected candidates have status "Selected" or "Rejected" (case-insensitive)
    return this.selectedCandidates.every((candidate) => {
      if (!candidate || !candidate.status) {
        return false;
      }
      const status = candidate.status.toLowerCase().trim();
      return status === 'selected' || status === 'rejected';
    });
  }

  /**
   * Checks if the Schedule button should be enabled
   * Enabled when the assign panel button is enabled (candidates have status "Selected" or "Rejected")
   */
  public isScheduleEnabled(): boolean {
    // Use the same condition as assign panel button
    return this.isAssignPanelEnabled();
  }

  /**
   * Checks if a candidate is assigned to a panel
   * Uses cached information if available, otherwise returns false
   */
  private isCandidateAssignedToPanel(candidateId: string): boolean {
    return this.candidatePanelAssignments.get(candidateId) ?? false;
  }


  public schedule(): void {
    const selected = this.selectedCandidates || [];

    if (!selected.length) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select at least one candidate to schedule.',
      });
      return;
    }

    const hasInvalidStatus = selected.some(
      (c: InterviewSummary) => c.status?.toLowerCase() !== 'selected',
    );

    if (hasInvalidStatus) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Invalid Selection',
        detail: 'Only candidates with status "Selected" can be scheduled.',
      });
      return;
    }

    // Check if all selected candidates are assigned to panels
    const allHavePanels = selected.every((c: InterviewSummary) =>
      this.isCandidateAssignedToPanel(c.id),
    );

    if (!allHavePanels) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Invalid Selection',
        detail:
          'All selected candidates must be assigned to a panel before scheduling.',
      });
      return;
    }

    const emails = selected.map((c: InterviewSummary) => c.email);
    this.openScheduleCandidateModal(emails);
  }
  public OnPanelClick(): void {
    if (this.selectedCandidates.length !== 1) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail:
          this.selectedCandidates.length === 0
            ? 'Please select a candidate to assign to a panel'
            : 'Cannot assign multiple candidates to a panel',
      });
      return;
    }

    this.ref = this.dialog.open(SelectPanelDailogComponent, {
      data: {
        assessmentid: this.assessmentId,
        interviewId: this.selectedCandidates[0].id,
      },
      header: '',
      maximizable: false,
      width: '60vw',
      modal: true,
      focusOnShow: false,
      closable: true,
      dismissableMask: true,
      styleClass: 'select-panel-dialog-wrapper',
      breakpoints: {
        '960px': '85vw',
        '640px': '95vw',
      },
    });
    this.ref.onClose.subscribe((result) => {
      // The modal now handles the API call internally
      // If result is truthy, it means the API call was successful
      if (result) {
        // Update panel assignment cache for the assigned candidate
        if (this.selectedCandidates.length > 0) {
          this.candidatePanelAssignments.set(
            this.selectedCandidates[0].id,
            true,
          );
        }
        // Refresh the candidate data to reflect the changes
        this.getPaginatedCandidateData(this.filterMap);
      }
    });
  }

  public Assign(selectedPanelIds: PanelSummary[], isAdd: boolean) {
    if (!selectedPanelIds.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select at least one candidate and one panel.',
      });
      return;
    }

    const selectedCandidate = this.selectedCandidates[0];
    const selectedPanel = selectedPanelIds[0];
    this.selectedPanels = selectedPanelIds[0];
    const selectedInterviewerIds =
      selectedPanel.interviewers?.map((i: any) => i.id) ?? [];

    const payload: InterviewPanels = {
      assessmentId: this.assessmentId,
      interviewId: Number(selectedCandidate.id),
      panelId: selectedPanel.id,
      interviewers: selectedInterviewerIds,
    };
    this.getInterviewPanels(selectedCandidate.id, payload, isAdd);
  }

  /**
   * Sets the active round menu item and loads the corresponding candidate data
   * @param index - The index of the selected round
   * @param stepId - The ID of the assessment round
   * @param stepStatus - The status of the round (e.g., 'Completed')
   */
  public setActiveMenuItem(
    index: number,
    stepId: number,
    stepStatus: string,
  ): void {
    this.activeMenuItemIndex = index;
    this.onStepChange(stepId, stepStatus);
  }

  private getInterviewPanels(
    selectedCandidate: string,
    payload: InterviewPanels,
    isAdd: boolean,
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
      }
      if (isAdd) {
        this.addInterviewPanels(payload);
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

  private addInterviewPanels(payload: InterviewPanels): void {
    this.interviewService.addinterviewpanel(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Interview panel added successfully.',
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
  private updateInterviewPanels(payload: InterviewPanels): void {
    const payloaddata: InterviewPanelsResponse = {
      assessmentId: this.assessmentId,
      interviewId: Number(payload.interviewId),
      panel: this.selectedPanels.panelName,
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
  public CompleteAssessmentRound() {
    const modalData: DialogData = {
      message: `Are you sure you want to complete the Round?`,
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Confirm',
    };
    this.ref = this.dialog.open(DialogComponent, {
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
      if (result) {
        const filter: FilterMap = {
          AssessmentRoundId: this.currentStep,
          AssessmentId: this.assessmentId,
        };
        this.filterMap = filter;
        this.getAssementRoundComplete(this.filterMap);
      }
    });
  }

  // Private Methods

  private setSidebarConfig(): void {
    this.sidebarConfig = [
      {
        items: [
          {
            label: 'Summary',
            icon: 'pi pi-palette',
            index: 0,
            routerLinkActiveOptions: { exact: true },

            command: () => {
              this.activeMenuItem = 0;
              this.filterMap = {
                assessmentId: this.assessmentId,
                assessmentRoundId: this.currentStep,
              };
              this.getPaginatedCandidateData(this.filterMap);
            },
          },
          {
            label: 'Selected',
            icon: 'pi pi-link',
            index: 1,
            command: () => {
              this.activeMenuItem = 1;
              this.filterMap = {
                ...this.filterMap,
                assessmentId: this.assessmentId,
                status: 'Selected',
              };
              this.getPaginatedCandidateData(this.filterMap);
            },
          },
          {
            label: 'Rejected',
            icon: 'pi pi-home',
            index: 2,
            command: () => {
              this.activeMenuItem = 2;
              this.filterMap = {
                ...this.filterMap,
                assessmentId: this.assessmentId,
                status: 'Rejected',
              };
              this.getPaginatedCandidateData(this.filterMap);
            },
          },
        ],
      },
    ];
  }

  private getAssessmentDetails(id: number): void {
    const next = (res: Assessment) => {
      this.data = res;
      // Normalize dates for proper display
      if (this.data.startDateTime) {
        this.data.startDateTime =
          this.parseDate(this.data.startDateTime) || this.data.startDateTime;
      }
      if (this.data.endDateTime) {
        this.data.endDateTime =
          this.parseDate(this.data.endDateTime) || this.data.endDateTime;
      }
    };
    const error = (error: string) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error,
      });
    };
    this.assessmentService.getEntityById(id).subscribe({ next, error });
  }

  private parseDate(date: string): string | null {
    if (!date) return null;
    const isoDate = new Date(date);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toISOString();
    }

    const parts = date.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day).toISOString();
    }
    return null;
  }

  private getAssessmentRoundDetails(id: number): void {
    this.isLoading = true;
    const next = (res: AssessmentRound[]) => {
      this.isLoading = false;
      this.step = res;
      this.assessmentRoundList = res;
      if (this.step.length > 0) {
        this.currentStep = this.step[0].id;
        this.roundStatus = this.step[0].status === 'Completed';
        this.filterMap = { assessmentRoundId: this.currentStep };
        this.getPaginatedCandidateData(this.filterMap);
      }
    };
    const error = (error: string) => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error,
      });
    };
    this.assessmentService
      .getAssessmentRoundByAssessmnetId(id)
      .subscribe({ next, error });
  }

  private openDeleteCandidateConfirmationModal(id: string) {
    const modalData: DialogData = {
      message: `Are you sure you want to delete the user?
      It will delete the user in all rounds.`,
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
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the User Successfully',
          });
          this.getPaginatedCandidateData({});
        };
        const error = () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Deletion is failed',
          });
        };
        this.interviewservice.DeleteCandidate(id).subscribe({ next, error });
      }
    });
  }

  private getPaginatedCandidateData(data: FilterMap) {
    this.isLoading = true;
    const payload = {
      multiSortedColumns: [],
      filterMap: data || {},
      pagination: {
        pageNumber: 1,
        pageSize: 5,
      },
    };
    this.interviewService
      .paginationEntity<CandidateData>('InterviewSummary', payload)
      .subscribe({
        next: (res: PaginatedData<CandidateData>) => {
          this.isLoading = false;
          const resData = res.data.map((item: CandidateData) => {
            return {
              ...item,
              isScheduled: item.isScheduled ? 'Scheduled' : 'Not Scheduled',
            };
          });

          this.tableData = { ...res, data: resData };
          this.selectedCandidates = [];

          this.isCompleteDisabled =
            this.tableData.data.length !== 0 &&
            this.tableData.data.some(
              (candidate: CandidateData) =>
                candidate.status === 'Pending' ||
                candidate.isScheduled === 'Not Scheduled',
            );

          // Load panel assignments for all candidates in the current page
          this.loadPanelAssignmentsForCandidates(resData);
        },
        error: () => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error in getting Candidate Details.',
          });
        },
      });
  }

  /**
   * Loads panel assignment status for all candidates in the current page
   * Updates the cache asynchronously
   */
  private loadPanelAssignmentsForCandidates(
    candidates: CandidateData[],
  ): void {
    candidates.forEach((candidate: CandidateData) => {
      const candidateId = String(candidate.id);
      // Only check if not already in cache
      if (!this.candidatePanelAssignments.has(candidateId)) {
        this.coordinatorPanelBridgeService
          .getinterviewPanles(candidateId)
          .subscribe({
            next: (response: GetInterviewPanelsResponse) => {
              // If we get a response with panelId, candidate has a panel assigned
              this.candidatePanelAssignments.set(
                candidateId,
                !!response?.panelId,
              );
            },
            error: () => {
              // If API call fails (e.g., 404), candidate doesn't have a panel
              this.candidatePanelAssignments.set(candidateId, false);
            },
          });
      }
    });
  }

  private openScheduleCandidateModal(selectedCandidateIds: string[]) {
    const filter: FilterMap = {
      AssessmentRoundId: this.currentStep,
    };
    this.filterMap = filter;
    this.ref = this.dialog.open(ScheduleInterviewComponent, {
      data: selectedCandidateIds,
      header: '',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      closable: true,
      dismissableMask: true,
      styleClass: 'schedule-interview-dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((result) => {
      if (result) {
        if (selectedCandidateIds.length === 0 || !result.scheduleDate) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'No candidates selected',
          });
        } else {
          if (this.assessmentRoundList) {
            const currentIndex = this.assessmentRoundList.findIndex(
              (round) => round.id === this.currentStep,
            );

            if (
              currentIndex !== -1 &&
              currentIndex < this.assessmentRoundList.length - 1
            ) {
              this.nextRoundId = this.assessmentRoundList[currentIndex + 1].id;
            }
          }
          result.scheduleDate = new Date(result.scheduleDate).toISOString();
          let payload = [];
          payload = selectedCandidateIds.map((id: string) => {
            const payloadData = {
              candidateId: id,
              assessmentRoundId: this.nextRoundId,
              isActive: true,
              statusId: 2,
              assessmentId: this.assessmentId,
              date: result.scheduleDate,
            };

            return payloadData;
          });

          const next = () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Interview Scheduled Successfully',
            });
            this.getPaginatedCandidateData(this.filterMap);
          };
          const error = (error: CustomErrorResponse) => {
            const businerssErrorCode = error.error.businessError;
            if (businerssErrorCode === 3109) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Interview Already Scheduled',
              });
            }
          };

          this.interviewservice
            .createEntity(payload)
            .subscribe({ next, error });
        }
      }
    });
  }

  private loadData(payload: PaginatedPayload): void {
    this.isLoading = true;
    this.dataSourceService
      .getData(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((response: PaginatedData<any>) => {
        const resData = response.data.map((item: CandidateData) => {
          return {
            ...item,
            isScheduled: item.isScheduled ? 'Scheduled' : 'Not Scheduled',
          };
        });

        this.tableData = { ...response, data: resData };
        this.isCompleteDisabled = this.tableData.data.some(
          (candidate: CandidateData) =>
            candidate.status === 'Pending' ||
            candidate.isScheduled === 'Not Scheduled',
        );

        // Load panel assignments for all candidates in the current page
        this.loadPanelAssignmentsForCandidates(resData);
      });
  }

  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${INTERVIEW_URL}/InterviewSummary`);
  }

  private UpdateCandidateStatus(Payload: CandidatePayload[], name: string) {
    const filter: FilterMap = {
      AssessmentRoundId: this.currentStep,
    };
    this.filterMap = filter;

    // Set loading state and clear tableData to show skeleton immediately
    this.isLoading = true;
    this.tableData = undefined as any;

    const next = () => {
      if (name == 'selected') {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Selected Candidates Successfully',
        });
      } else {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Rejected Candidates Successfully',
        });
      }
      this.getPaginatedCandidateData(this.filterMap);
    };

    const error = () => {
      this.isLoading = false;
      if (name == 'selected') {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Selection of candidates is failed',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Rejection of candidates is failed',
        });
      }
    };
    this.interviewService
      .updateEntity('InterviewStatus', Payload)
      .subscribe({ next, error });
  }

  private getAssementRoundComplete(data: FilterMap) {
    const payload = {
      multiSortedColumns: [],
      filterMap: data || {},
      pagination: {
        pageNumber: 1,
        pageSize: 1,
      },
    };
    this.assessmentService
      .paginationEntity<AssesmentRoundResponse>(
        'AssessmentRoundSummary',
        payload,
      )
      .subscribe({
        next: (res: PaginatedData<AssesmentRoundResponse>) => {
          if (res.data.length == 0) {
            const payloadData = {
              assessmentId: this.assessmentId,
              assessmentRoundId: this.currentStep,
            };
            const next = () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Completed Assessment Round Successfully',
              });
              this.roundStatus = true;
            };
            const error = () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Completion of Assessment Round failed',
              });
            };
            this.assessmentService
              .updateEntity(
                'assessmentRound/assessmentRoundComplete',
                payloadData,
              )
              .subscribe({ next, error });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Kindly complete the pending tasks in this round',
            });
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error in candidates confirm.',
          });
        },
      });
  }
}
