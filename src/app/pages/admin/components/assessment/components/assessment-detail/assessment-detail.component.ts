/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
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
  public isCompletingRound = false;

  private nextRoundId!: number | null;
  private candidatePanelAssignments = new Map<string, boolean>();
  private candidatesBeingLoaded = new Set<string>(); // Track candidates currently being loaded to prevent duplicate API calls

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
    private readonly cdr: ChangeDetectorRef,
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

    // Check if any candidates are selected
    if (this.selectedCandidates.length === 0) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No selected Candidate to reject.',
      });
      return;
    }

    // Validate that all selected candidates have "Completed" status
    const nonCompletedCandidates = this.selectedCandidates.filter(
      (candidate: InterviewSummary) => {
        const status = candidate.status?.toLowerCase().trim();
        return status !== 'completed';
      },
    );

    if (nonCompletedCandidates.length > 0) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Only candidates with "Completed" status can be rejected.',
      });
      return;
    }

    // Check if any candidates are already rejected
    const alreadyRejectedCandidates = this.selectedCandidates.filter(
      (candidate: InterviewSummary) => {
        const status = candidate.status?.toLowerCase().trim();
        return status === 'rejected';
      },
    );

    if (alreadyRejectedCandidates.length > 0) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'One or more selected candidates are already rejected.',
      });
      return;
    }

    const name = 'rejected';
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
  }

  public selectCandidate() {
    const name = 'selected';

    // Check if any candidates are selected
    if (this.selectedCandidates.length === 0) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No selected Candidate to mark as select.',
      });
      return;
    }

    // Validate that all selected candidates have "Completed" status
    const nonCompletedCandidates = this.selectedCandidates.filter(
      (candidate: InterviewSummary) => {
        const status = candidate.status?.toLowerCase().trim();
        return status !== 'completed';
      },
    );

    if (nonCompletedCandidates.length > 0) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Only candidates with "Completed" status can be selected.',
      });
      return;
    }

    // Check if any candidates are already selected
    const alreadySelectedCandidates = this.selectedCandidates.filter(
      (candidate: InterviewSummary) => {
        const status = candidate.status?.toLowerCase().trim();
        return status === 'selected';
      },
    );

    if (alreadySelectedCandidates.length > 0) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'One or more selected candidates are already selected.',
      });
      return;
    }

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
   * Checks if the Select button should be enabled
   * Enabled when at least one candidate is selected and all selected candidates have status "Completed"
   */
  public isSelectEnabled(): boolean {
    // Must have at least one candidate selected
    if (!this.selectedCandidates || this.selectedCandidates.length === 0) {
      return false;
    }

    // Check if all selected candidates have status "Completed" (case-insensitive)
    return this.selectedCandidates.every((candidate) => {
      if (!candidate || !candidate.status) {
        return false;
      }
      const status = candidate.status.toLowerCase().trim();
      return status === 'completed';
    });
  }

  /**
   * Checks if the Reject button should be enabled
   * Enabled when at least one candidate is selected and all selected candidates have status "Completed"
   */
  public isRejectEnabled(): boolean {
    // Must have at least one candidate selected
    if (!this.selectedCandidates || this.selectedCandidates.length === 0) {
      return false;
    }

    // Check if all selected candidates have status "Completed" (case-insensitive)
    return this.selectedCandidates.every((candidate) => {
      if (!candidate || !candidate.status) {
        return false;
      }
      const status = candidate.status.toLowerCase().trim();
      return status === 'completed';
    });
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
   * Enabled when:
   * 1. At least one candidate is selected
   * 2. All selected candidates have status "Selected" (matching schedule() method requirement)
   * 3. For non-aptitude rounds: All selected candidates are assigned to a panel (checked from cache only)
   * 
   * Note: If panel data is not in cache, the button is enabled anyway and validation happens in the modal
   */
  public isScheduleEnabled(): boolean {
    // Must have at least one candidate selected
    if (!this.selectedCandidates || this.selectedCandidates.length === 0) {
      return false;
    }

    // Check if all selected candidates have status "Selected" (case-insensitive)
    // This matches the requirement in schedule() method
    const hasValidStatus = this.selectedCandidates.every((candidate) => {
      if (!candidate || !candidate.status) {
        return false;
      }
      const status = candidate.status.toLowerCase().trim();
      return status === 'selected';
    });

    if (!hasValidStatus) {
      return false;
    }

    // For aptitude rounds, panel assignment is not required
    if (this.isAptitudeRound()) {
      return true;
    }

    // For non-aptitude rounds, check panel assignments from cache only
    // If not in cache, enable button anyway - validation will happen in the modal
    const allCandidatesInCache = this.selectedCandidates.every((candidate) => {
      if (!candidate || !candidate.id) {
        return false;
      }
      return this.candidatePanelAssignments.has(candidate.id);
    });

    // If all candidates are in cache, check if they have panels assigned
    if (allCandidatesInCache) {
      return this.selectedCandidates.every((candidate) => {
        if (!candidate || !candidate.id) {
          return false;
        }
        return this.isCandidateAssignedToPanel(candidate.id);
      });
    }

    // If not all candidates are in cache, enable button anyway
    // The schedule modal will validate and show appropriate messages
    // Load panel data in background for future checks (non-blocking)
    const candidateIdsToLoad = this.selectedCandidates
      .filter((candidate) => 
        candidate?.id && 
        !this.candidatePanelAssignments.has(candidate.id) &&
        !this.candidatesBeingLoaded.has(candidate.id) // Don't load if already being loaded
      )
      .map((candidate) => candidate.id);
    
    if (candidateIdsToLoad.length > 0) {
      // Load in background without blocking button enablement
      // Use requestAnimationFrame to avoid triggering during change detection
      requestAnimationFrame(() => {
        this.loadPanelAssignmentsForCandidates(candidateIdsToLoad);
      });
    }

    return true;
  }

  /**
   * Checks if the current round is an aptitude round
   * Returns true if the current round's name contains "aptitude" (case-insensitive)
   */
  public isAptitudeRound(): boolean {
    if (!this.assessmentRoundList || !this.currentStep) {
      return false;
    }
    const currentRound = this.assessmentRoundList.find(
      (round) => round.id === this.currentStep,
    );
    if (!currentRound || !currentRound.round) {
      return false;
    }
    return currentRound.round.toLowerCase().includes('aptitude');
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

    // STEP 1: Calculate minimal data (these are instant operations - no API calls)
    const emails = selected.map((c: InterviewSummary) => c.email);
    const candidateIds = selected.map((c: InterviewSummary) => c.id);
    const needsPanelValidation = !this.isAptitudeRound();

    // Store reference for later
    let componentInstanceRef: ScheduleInterviewComponent | null = null;
    const updateComponentInstance = (instance: ScheduleInterviewComponent) => {
      componentInstanceRef = instance;
    };

    // STEP 2: OPEN MODAL IMMEDIATELY - this is synchronous, no API calls here!
    // Show loader if panel validation is needed (we'll check cache after modal opens)
    const modalRef = this.openScheduleCandidateModal(
      emails,
      candidateIds,
      selected,
      updateComponentInstance,
      needsPanelValidation, // Show loader - we'll hide it if all data is cached
    );

    // STEP 3: After modal is rendered, check cache and load data (non-blocking)
    // Use setTimeout to ensure modal DOM is rendered first
    setTimeout(() => {
      if (needsPanelValidation) {
        // Check cache (this is instant - just a Map lookup)
        const uncachedIds = candidateIds.filter(
          (id) => !this.candidatePanelAssignments.has(id),
        );

        const getInstance = () => {
          return (
            componentInstanceRef ||
            ((modalRef as any).componentRef
              ?.instance as ScheduleInterviewComponent)
          );
        };

        // Process after component is ready
        const processAfterReady = () => {
          const instance = getInstance();
          if (instance) {
            if (uncachedIds.length > 0) {
              // Need to fetch panel data - loader should already be showing
              this.loadPanelAssignmentsInBackground(
                uncachedIds,
                selected,
                getInstance,
              );
            } else {
              // All data is cached - hide loader and enable form immediately
              instance.handlePanelValidationSuccess();
            }
          } else {
            // Component not ready yet, retry quickly
            setTimeout(processAfterReady, 10);
          }
        };

        processAfterReady();
      }
    }, 0);
  }
  public OnPanelClick(): void {
    // Don't allow panel assignment for aptitude rounds
    if (this.isAptitudeRound()) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Panel assignment is not available for aptitude rounds.',
      });
      return;
    }

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
      const existingInterviewerIds = this.interview.interviewer?.map((i: any) => i.id) ?? [];
      const isInterviewerSame =
        JSON.stringify(payload.interviewers.slice().sort((a, b) => a.localeCompare(b))) ===
        JSON.stringify(existingInterviewerIds.slice().sort((a, b) => a.localeCompare(b)));

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
      // If we were completing a round, stop showing the skeleton now
      if (this.isCompletingRound) {
        this.isCompletingRound = false;
      }
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
      // Stop showing skeleton on error too
      if (this.isCompletingRound) {
        this.isCompletingRound = false;
      }
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

          // Note: Panel assignments are now loaded lazily only when needed
          // (e.g., when checking if candidates can be scheduled)
          // This avoids making unnecessary API calls for each candidate on page load
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
   * Loads panel assignment status for specific candidates on-demand
   * Updates the cache asynchronously
   * This is called only when needed (e.g., when checking if candidates can be scheduled)
   * Does not make API calls for aptitude rounds
   */
  private loadPanelAssignmentsForCandidates(candidateIds: string[]): void {
    // Don't load panel assignments for aptitude rounds
    if (this.isAptitudeRound()) {
      return;
    }

    candidateIds.forEach((candidateId: string) => {
      // Only check if not already in cache and not currently being loaded
      if (!this.candidatePanelAssignments.has(candidateId) && !this.candidatesBeingLoaded.has(candidateId)) {
        // Mark as being loaded to prevent duplicate calls
        this.candidatesBeingLoaded.add(candidateId);
        
        this.coordinatorPanelBridgeService
          .getinterviewPanles(candidateId)
          .subscribe({
            next: (response: GetInterviewPanelsResponse) => {
              // If we get a response with panelId, candidate has a panel assigned
              this.candidatePanelAssignments.set(
                candidateId,
                !!response?.panelId,
              );
              // Remove from loading set
              this.candidatesBeingLoaded.delete(candidateId);
              // Use markForCheck instead of detectChanges to avoid triggering during change detection
              if (this.cdr) {
                this.cdr.markForCheck();
              }
            },
            error: () => {
              // If API call fails (e.g., 404), candidate doesn't have a panel
              this.candidatePanelAssignments.set(candidateId, false);
              // Remove from loading set
              this.candidatesBeingLoaded.delete(candidateId);
              // Use markForCheck instead of detectChanges to avoid triggering during change detection
              if (this.cdr) {
                this.cdr.markForCheck();
              }
            },
          });
      }
    });
  }

  /**
   * Loads panel assignments in background and validates
   * Does not make API calls for aptitude rounds
   */
  private loadPanelAssignmentsInBackground(
    candidateIds: string[],
    selected: InterviewSummary[],
    getComponentInstance: () => ScheduleInterviewComponent | null,
  ): void {
    // Don't load panel assignments for aptitude rounds
    if (this.isAptitudeRound()) {
      const componentInstance = getComponentInstance();
      if (componentInstance) {
        // For aptitude rounds, skip panel validation and enable form directly
        componentInstance.handlePanelValidationSuccess();
      }
      return;
    }

    // Filter out candidates that are already being loaded or are in cache
    const candidatesToLoad = candidateIds.filter(
      (candidateId) =>
        !this.candidatePanelAssignments.has(candidateId) &&
        !this.candidatesBeingLoaded.has(candidateId),
    );

    // Mark candidates as being loaded
    candidatesToLoad.forEach((candidateId) => {
      this.candidatesBeingLoaded.add(candidateId);
    });

    const requests = candidatesToLoad.map((candidateId: string) =>
      this.coordinatorPanelBridgeService.getinterviewPanles(candidateId).pipe(
        // Handle both success and error cases
        catchError(() => {
          // If API call fails (e.g., 404), candidate doesn't have a panel
          this.candidatePanelAssignments.set(candidateId, false);
          this.candidatesBeingLoaded.delete(candidateId);
          // Return a default response indicating no panel assigned
          return of({
            panel: '',
            assessmentId: 0,
            interviewId: 0,
            panelId: 0,
            interviewer: [],
          } as GetInterviewPanelsResponse);
        }),
      ),
    );

    // If no candidates to load, validate immediately
    if (requests.length === 0) {
      const componentInstance = getComponentInstance();
      if (componentInstance) {
        this.validatePanelAssignmentsAndUpdateModal(
          selected,
          componentInstance,
        );
      }
      return;
    }

    // Wait for all requests to complete
    forkJoin(requests).subscribe({
      next: (responses: GetInterviewPanelsResponse[]) => {
        // Update cache for all responses
        responses.forEach((response, index) => {
          const candidateId = candidatesToLoad[index];
          this.candidatePanelAssignments.set(candidateId, !!response?.panelId);
          this.candidatesBeingLoaded.delete(candidateId);
        });
        // Validate and update modal
        const componentInstance = getComponentInstance();
        if (componentInstance) {
          this.validatePanelAssignmentsAndUpdateModal(
            selected,
            componentInstance,
          );
        }
      },
      error: () => {
        // Remove all candidates from loading set on error
        candidatesToLoad.forEach((candidateId) => {
          this.candidatesBeingLoaded.delete(candidateId);
        });
        // Even if some requests fail, still validate with what we have
        const componentInstance = getComponentInstance();
        if (componentInstance) {
          this.validatePanelAssignmentsAndUpdateModal(
            selected,
            componentInstance,
          );
        }
      },
    });
  }

  /**
   * Validates panel assignments and updates modal state
   */
  private validatePanelAssignmentsAndUpdateModal(
    selected: InterviewSummary[],
    componentInstance: ScheduleInterviewComponent,
  ): void {
    // Check if all candidates have panels assigned
    const allHavePanels = selected.every((c: InterviewSummary) =>
      this.isCandidateAssignedToPanel(c.id),
    );

    if (!allHavePanels) {
      // Stop loading and show error
      componentInstance.handlePanelValidationError();
      this.messagesService.add({
        severity: 'warn',
        summary: 'Invalid Selection',
        detail:
          'All selected candidates must be assigned to a panel before scheduling.',
      });
    } else {
      // Stop loading and enable form
      componentInstance.handlePanelValidationSuccess();
    }
  }

  private openScheduleCandidateModal(
    selectedCandidateIds: string[],
    candidateIds?: string[],
    selected?: InterviewSummary[],
    updateComponentInstance?: (instance: ScheduleInterviewComponent) => void,
    isLoadingPanelData = false,
  ): DynamicDialogRef {
    // Set filter map (lightweight operation)
    const filter: FilterMap = {
      AssessmentRoundId: this.currentStep,
    };
    this.filterMap = filter;

    // Open modal IMMEDIATELY - no blocking operations before this

    // Create callback functions to handle submit, success, and error
    let componentInstance: ScheduleInterviewComponent | null = null;

    const handleSubmit = (formValue: { scheduleDate: Date }) => {
      if (selectedCandidateIds.length === 0 || !formValue.scheduleDate) {
        if (componentInstance) {
          componentInstance.handleError();
        }
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'No candidates selected',
        });
        return;
      }

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
      const scheduleDate = new Date(formValue.scheduleDate).toISOString();
      let payload = [];
      payload = selectedCandidateIds.map((id: string) => {
        const payloadData = {
          candidateId: id,
          assessmentRoundId: this.nextRoundId,
          isActive: true,
          statusId: 2,
          assessmentId: this.assessmentId,
          date: scheduleDate,
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
        // Close modal only on success
        if (componentInstance) {
          componentInstance.closeOnSuccess();
        }
      };
      const error = (error: CustomErrorResponse) => {
        if (componentInstance) {
          componentInstance.handleError();
        }
        const businerssErrorCode = error.error.businessError;
        if (businerssErrorCode === 3109) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Interview Already Scheduled',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to schedule interview. Please try again.',
          });
        }
      };

      this.interviewservice.createEntity(payload).subscribe({ next, error });
    };

    this.ref = this.dialog.open(ScheduleInterviewComponent, {
      data: {
        candidateIds: selectedCandidateIds,
        onSubmit: handleSubmit,
        isLoadingPanelData: isLoadingPanelData,
        setComponentInstance: (instance: ScheduleInterviewComponent) => {
          componentInstance = instance;
          if (updateComponentInstance) {
            updateComponentInstance(instance);
          }
        },
      },
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

    // Handle modal close (when user clicks cancel or closes)
    this.ref.onClose.subscribe(() => {
      // This will be called when modal is closed
      // result will be undefined if closed via cancel, or formValue if closed via success
    });

    return this.ref;
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

        // Note: Panel assignments are now loaded lazily only when needed
        // This avoids making unnecessary API calls for each candidate on page load
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
    // Set loading state
    this.isCompletingRound = true;

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
            const nextComplete = () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Completed Assessment Round Successfully',
              });
              this.roundStatus = true;
              // Refetch assessment rounds to update the status
              // Keep isCompletingRound true until refetch completes
              this.getAssessmentRoundDetails(this.assessmentId);
            };
            const errorComplete = () => {
              this.isCompletingRound = false;
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
              .subscribe({ next: nextComplete, error: errorComplete });
          } else {
            this.isCompletingRound = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Kindly complete the pending tasks in this round',
            });
          }
        },
        error: () => {
          this.isCompletingRound = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to check round completion status',
          });
        },
      });
  }
}
