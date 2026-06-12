/* eslint-disable @typescript-eslint/no-explicit-any */
// Force refresh build
import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { HistoryDrawerComponent } from '../../../../../../shared/components/history-drawer/history-drawer.component';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { Menu, MenuModule } from 'primeng/menu';
import { SkeletonModule } from 'primeng/skeleton';
import { StepperModule } from 'primeng/stepper';
import { TooltipModule } from 'primeng/tooltip';
import { of, forkJoin } from 'rxjs';
import { PaginatedData, PaginatedPayload, FilterMap } from '../../../../../../shared/models/pagination.models';
import { toLocalISOString } from '../../../../../../shared/utilities/date.utility';
import { recruitment } from '../../../../../../shared/models/stepper.models';
import {
  FieldType,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { StatusEnum } from '../../../../../../shared/enums/status.enum';
import { AssessmentService } from '../../../../services/assessment.service';
import { CandidateService } from '../../services/candidate.service';
import { InterviewService } from '../../services/interview.service';
import {
  Assessment,
  AssessmentRound,
} from '../../../../models/assessment.model';
import { RoundCompletionWarningComponent } from './components/round-completion-warning/round-completion-warning.component';
import { CreateBatchDialogComponent } from '../assessment-view/components/create-batch-dialog/create-batch-dialog.component';
import { BatchService } from '../../../../services/batch.service';
import { ScheduleInterviewComponent } from './components/schedule-interview/schedule-interview.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { SelectPanelDailogComponent } from './components/select-panel-dailog/select-panel-dailog.component';
import { ScheduleMismatchComponent } from './components/schedule-mismatch/schedule-mismatch.component';



interface CandidateData {
  id: string;
  name: string;
  email: string;
  score: string;
  status: string;
  assessmentRoundId: number;
}

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Candidate Name',
      fieldType: FieldType.String,
      sortedColumn: true,
    },
    {
      field: 'email',
      displayName: 'Email ID',
      fieldType: FieldType.String,
      sortedColumn: true,
    },
    {
      field: 'score',
      displayName: 'Score',
      fieldType: FieldType.String,
      sortedColumn: true,
    },
    {
      field: 'status',
      displayName: 'Status',
      fieldType: FieldType.String,
      sortedColumn: true,
    },
    {
      field: 'nextRoundStatus',
      displayName: 'Next Round Status',
      fieldType: FieldType.String,
      sortedColumn: true,
    },
    {
      field: 'interviewDate',
      displayName: 'Interview Date',
      fieldType: FieldType.StringToDateTime,
      sortedColumn: true,
    },
    {
      field: 'button',
      displayName: 'Action',
      buttonIcons: ['pi pi-eye', 'pi pi-lock-open', 'pi pi-history'],
      buttonLabels: ['View', 'Unlock', 'History'],
      buttonTooltips: ['View', 'Unlock', 'History']
    },
  ]
};

@Component({
  selector: 'app-assessment-detail',
  standalone: true,
  imports: [
    CommonModule,
    SkeletonModule,
    StepperModule,
    ButtonModule,
    MenuModule,
    TableComponent,
    HistoryDrawerComponent,
    ButtonComponent,
    NgClass,
    TooltipModule,
    CarouselModule,
    ConfirmDialogModule,
  ],
  templateUrl: './assessment-detail.component.html',
  styleUrl: './assessment-detail.component.scss',
})
export class AssessmentDetailComponent implements OnInit, OnDestroy {
  public assessmentId!: number;
  public sidebarConfig!: MenuItem[];
  public data!: Assessment;
  public tableData!: PaginatedData<any>;
  public columns: TableColumnsData = tableColumns;
  public step!: AssessmentRound[];
  public stepperConfig!: recruitment[];
  public summaryStats: Record<string, number> = {
    total: 0,
    selected: 0,
    rejected: 0,
    pending: 0,
  };
  public statCardsConfig = [
    {
      key: 'total',
      label: 'Total Candidates',
      icon: 'pi pi-users',
      colorClass: 'blue',
    },
    {
      key: 'selected',
      label: 'Selected',
      icon: 'pi pi-check-circle',
      colorClass: 'green',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      icon: 'pi pi-times-circle',
      colorClass: 'red',
    },
    {
      key: 'pending',
      label: 'Pending Actions',
      icon: 'pi pi-clock',
      colorClass: 'orange',
    },
  ];
  public roundPerformanceData: any[] = [];
  public responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: '1200px',
      numVisible: 2,
      numScroll: 1,
    },
    {
      breakpoint: '768px',
      numVisible: 1,
      numScroll: 1,
    },
  ];
  public activeMenuItem = 0;
  public activeMenuItemIndex = 0;
  public currentStep!: number | null;
  public filterMap!: FilterMap;
  public roundStatus: boolean = false;
  public isLoading: boolean = true;
  public isCompletingRound: boolean = false;
  public isAllRoundsCompleted: boolean = false;

  public visible = false;
  public historyLoading = false;
  public events: any[] = [];
  public historyPagination = {
    pageNumber: 1,
    pageSize: 10,
    totalRecords: 0,
    candidateId: '',
  };
  public currentHistoryInterviewId: string | null = null;
  public selectedCandidateIds: string[] = [];

  private nextRoundId!: number | null;
  private ref: DynamicDialogRef | undefined;
  public pendingScheduleCandidateIds: string[] = [];


  public availableBatches: any = null;
  public availableQuestionSets: any = null;
  public actionItems: MenuItem[] = [];
  public selectedGuideTab: 'aptitude' | 'interview' = 'interview';

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly assessmentService: AssessmentService,
    private readonly messageService: MessageService,
    private readonly interviewService: InterviewService,
    public readonly dialog: DialogService,
    private readonly cdr: ChangeDetectorRef,
    public readonly candidateService: CandidateService,
    public readonly batchService: BatchService,
    public readonly confirmationService: ConfirmationService,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    const routeId = this.activatedRoute.snapshot.paramMap.get('id');
    if (routeId) {
      this.assessmentId = Number(routeId);
      this.getAssessmentDetails(this.assessmentId);
      this.getAssessmentRoundDetails(this.assessmentId);
      this.getAssessmentSummaryData(this.assessmentId);
      this.updateActionItems();
    }
    this.setSidebarConfig();
  }

  private loadAssignmentData(): void {
    const batchesPayload = new PaginatedPayload();
    batchesPayload.pagination.pageSize = -1;
    batchesPayload.filterMap = { status: 'Active' };
    this.batchService.paginationEntity('Batchsummary', batchesPayload).subscribe(res => {
      this.availableBatches = res;
    });

    const questionSetsPayload = new PaginatedPayload();
    questionSetsPayload.filterMap = { assessmentId: this.assessmentId, assessmentRoundId: this.currentStep ?? 0, activeSet: '' };
    questionSetsPayload.pagination.pageSize = -1;
    this.assessmentService.paginationEntity('QuestionSetSummary', questionSetsPayload).subscribe(res => {
      this.availableQuestionSets = res;
    });
  }
  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }

  // Public Methods
  public setActiveMenuItem(index: number, id: number, status?: string): void {
    this.activeMenuItemIndex = index;
    this.currentStep = id;
    this.roundStatus = status === 'Completed';

    const selectedRound = this.step[index];
    this.updateTableColumns(selectedRound?.roundTypeId);

    // Automatically update selectedGuideTab based on the round type
    const roundName = selectedRound?.round?.toLowerCase() || '';
    const roundTypeId = selectedRound?.roundTypeId;
    const isAptitude = roundTypeId === 1 || roundName.includes('aptitude') || roundName.includes('test');
    this.selectedGuideTab = isAptitude ? 'aptitude' : 'interview';

    this.filterMap = {
      assessmentId: this.assessmentId,
      assessmentRoundId: id,
    };
    this.selectedCandidateIds = []; // Clear selection on step change
    this.getPaginatedCandidateData(this.filterMap);
  }

  private updateTableColumns(roundTypeId?: number): void {
    const baseColumns: any[] = [
      {
        field: 'name',
        displayName: 'Candidate Name',
        fieldType: FieldType.String,
        sortedColumn: true,
        hasTextFilter: true,
        filterAlias: 'textFilter',
        queryParams: {
          assessmentRoundId: this.currentStep || 0,
          breadcrumbSource: 'details',
        },
        queryParamsHandling: 'merge',
      },
      {
        field: 'email',
        displayName: 'Email ID',
        fieldType: FieldType.String,
        sortedColumn: true,
        hasTextFilter: true,
        filterAlias: 'textFilter',
      },
      {
        field: 'score',
        displayName: 'Score',
        fieldType: FieldType.String,
        sortedColumn: true,
        hasTextFilter: true,
        filterAlias: 'scoreFilter',
      }
    ];

    const selectedRound = this.step?.[this.activeMenuItemIndex];
    const roundName = selectedRound?.round?.toLowerCase() || '';
    const isPanel = roundTypeId === 2 || String(roundTypeId) === '2' || roundName.includes('panel') || roundName.includes('interview');

    if (isPanel) {
      baseColumns.push({
        field: 'panel',
        displayName: 'Panel',
        fieldType: FieldType.String,
        sortedColumn: true,
        hasTextFilter: true,
        filterAlias: 'textFilter',
      });
    }

    if (roundTypeId === 1) {
      baseColumns.push({
        field: 'batch',
        displayName: 'Batch',
        fieldType: FieldType.String,
        sortedColumn: true,
        hasTextFilter: true,
        filterAlias: 'textFilter',
      });
      baseColumns.push({
        field: 'questionSet',
        displayName: 'Question Set',
        fieldType: FieldType.String,
        sortedColumn: true,
        hasTextFilter: true,
        filterAlias: 'textFilter',
      });
    }

    baseColumns.push(
      {
        field: 'status',
        displayName: 'Status',
        fieldType: FieldType.String,
        sortedColumn: true,
        hasTextFilter: true,
        filterAlias: 'statusFilter',
        hasMultiStatus: true,
      }
    );

    const isLastRound = this.activeMenuItemIndex === (this.step?.length || 0) - 1;
    if (!isLastRound) {
      baseColumns.push({
        field: 'nextRoundStatus',
        displayName: 'Next Round Status',
        fieldType: FieldType.String,
        sortedColumn: true,
        hasTextFilter: true,
        filterAlias: 'statusFilter',
        hasMultiStatus: false,
      });
    }

    baseColumns.push(
      {
        field: 'interviewDate',
        displayName: 'Interview Date',
        fieldType: FieldType.StringToDateTime,
        sortedColumn: true,
        hasTextFilter: true,
        filterAlias: 'textFilter',
      }
    );

    // Add Actions column with dropdown
    const actionsColumn: any = {
      field: 'button',
      displayName: 'Action',
      buttonIcons: ['pi pi-eye', 'pi pi-lock-open', 'pi pi-history'],
      buttonLabels: ['View', 'Unlock', 'History'],
      buttonTooltips: ['View', 'Unlock', 'History']
    };

    baseColumns.push(actionsColumn);

    this.columns = { columns: baseColumns };
    this.cdr.detectChanges();
  }

  public getSelectedCandidatesOnTable(candidates: any[]): void {
    this.selectedCandidateIds = candidates.map(c => c.id);
    this.updateActionItems();
  }

  public navigateToSummary(): void {
    if (this.isAllRoundsCompleted) {
      this.router.navigate([`/admin/recruitments/recruitment-summary/${this.assessmentId}`]);
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'In Progress',
        detail: 'Complete all rounds to view the recruitment summary.'
      });
    }
  }

  public isAptitudeRound(): boolean {
    if (!this.step || this.activeMenuItemIndex === -1) return false;
    const currentRound = this.step[this.activeMenuItemIndex];
    return currentRound?.roundTypeId === 1 ||
           currentRound?.round?.toLowerCase().includes('aptitude') || 
           currentRound?.round?.toLowerCase().includes('test');
  }

  public isLastRound(): boolean {
    if (!this.step || this.step.length === 0) return false;
    return this.activeMenuItemIndex === this.step.length - 1;
  }

  public hasUncompletedPreviousRound(): boolean {
    if (!this.step || this.activeMenuItemIndex <= 0) return false;
    for (let i = 0; i < this.activeMenuItemIndex; i++) {
      if (this.step[i]?.status !== 'Completed') {
        return true;
      }
    }
    return false;
  }

  public onButtonClick(data: { event: any; fName: string }): void {
    const { event, fName } = data;
    if (fName === 'View') {
      this.onView(event);
    } else if (fName === 'Unlock') {
      this.unlockCandidate(event);
    } else if (fName === 'History') {
      this.viewHistory(event);
    } else if (fName === 'Assign to Batch') {
      this.onAssignToBatch(event);
    } else if (fName === 'Schedule') {
      this.onScheduleCandidate(event);
    }
  }

  public onAssignToPanel(): void {
    if (this.selectedCandidateIds.length === 0) return;
    if (this.selectedCandidateIds.length > 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Cannot assign multiple candidates to a panel at a time.',
      });
      return;
    }

    const selectedCandidate = this.tableData?.data?.find((c: any) => c.id === this.selectedCandidateIds[0]);
    if (!selectedCandidate) return;

    this.ref = this.dialog.open(SelectPanelDailogComponent, {
      data: {
        assessmentid: this.assessmentId,
        interviewId: selectedCandidate.interviewId || selectedCandidate.id,
      },
      header: 'Assign Candidate to Panel',
      maximizable: false,
      width: '65vw',
      modal: true,
      styleClass: 'standard-dialog-wrapper',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((result) => {
      if (result) {
        this.selectedCandidateIds = [];
        this.getPaginatedCandidateData(this.filterMap);
      }
    });
  }

  private onAssignToBatch(candidate: any): void {
    const batchesPayload = new PaginatedPayload();
    batchesPayload.pagination.pageSize = -1;
    batchesPayload.filterMap = { status: 'Active' };
    const batches$ = this.batchService.paginationEntity('Batchsummary', batchesPayload);

    const questionSetsPayload = new PaginatedPayload();
    questionSetsPayload.filterMap = { assessmentId: this.assessmentId, assessmentRoundId: this.currentStep ?? 0, activeSet: '' };
    questionSetsPayload.pagination.pageSize = -1;
    const questionSets$ = this.assessmentService.paginationEntity('QuestionSetSummary', questionSetsPayload);

    this.openAssignToBatchDialog(candidate, batches$, questionSets$);
  }

  private openAssignToBatchDialog(candidate: any, batches$: any, questionSets$: any): void {
    this.isLoading = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.ref = this.dialog.open(CreateBatchDialogComponent, {
        header: 'Assign to Batch',
        width: '500px',
        modal: true,
        data: {
          batches$: batches$,
          questionSets$: questionSets$,
          assessmentId: this.assessmentId,
          currentRoundId: this.currentStep,
          candidateData: this.tableData
        }
      });

      this.ref.onClose.subscribe((result: any) => {
        if (result) {
          this.executeBatchAssignment(result, candidate);
        }
      });
    }, 0);
  }

  private executeBatchAssignment(dialogResult: any, candidate: any): void {
    const candidateIds = candidate.id ? [candidate.id] : this.selectedCandidateIds;
    
    if (candidateIds.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Candidates Selected',
        detail: 'Please select at least one candidate to assign.'
      });
      return;
    }

    this.isLoading = true;
    const payload = {
      candidatesIds: candidateIds,
      assessmentId: this.assessmentId,
      batchId: dialogResult.batchId,
      questionSetIds: [dialogResult.questionSetId],
      startDateTime: dialogResult.startDate ? new Date(dialogResult.startDate).toISOString() : null,
      endDateTime: dialogResult.endDate ? new Date(dialogResult.endDate).toISOString() : null
    };

    this.candidateService.createEntity(payload as any, 'add-batch')
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Batch assigned successfully'
          });
          this.selectedCandidateIds = [];
          this.getPaginatedCandidateData(this.filterMap);
        },
        error: (err) => {
          console.error('Batch assignment failed:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.type || err.error?.message || 'Failed to assign batch'
          });
        }
      });
  }

  private onScheduleCandidate(candidate: any): void {
    const candidateIdStr = String(candidate.id || '');
    const candidateIds = candidateIdStr.includes(',')
      ? candidateIdStr.split(',')
      : [candidateIdStr];

    const candidatesToCheck = this.tableData?.data?.filter((c: any) => candidateIds.includes(String(c.id))) || [];

    if (this.isAptitudeRound()) {
      const missingBatch = candidatesToCheck.some((c: any) => !c.batch || c.batch === '-' || String(c.batch).trim() === '' || String(c.batch).toLowerCase().includes('unassigned'));
      if (missingBatch) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Please assign a batch to the selected candidate(s) before scheduling.',
        });
        return;
      }
    } else {
      const missingPanel = candidatesToCheck.some((c: any) => !c.panel || c.panel === '-' || String(c.panel).trim() === '' || String(c.panel).toLowerCase().includes('unassigned'));
      if (missingPanel) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Please assign a panel to the selected candidate(s) before scheduling.',
        });
        return;
      }
    }

    this.pendingScheduleCandidateIds = candidateIds;

    this.ref = this.dialog.open(ScheduleInterviewComponent, {
      header: 'Schedule Interview',
      width: '500px',
      modal: true,
      styleClass: 'standard-dialog-wrapper',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      data: {
        candidateIds: this.pendingScheduleCandidateIds,
        candidates: candidatesToCheck.map((c: any) => ({
          id: String(c.id),
          name: c.name || String(c.id)
        })),
        assessmentId: this.assessmentId,
        startDateTime: this.data?.startDateTime,
        endDateTime: this.data?.endDateTime,
        onSubmit: (formValue: { scheduleDate: Date, candidateIds?: string[] }) => {
          if (formValue.candidateIds) {
            this.pendingScheduleCandidateIds = formValue.candidateIds;
          }
          this.confirmSchedule(formValue.scheduleDate);
        },
        setComponentInstance: (instance: ScheduleInterviewComponent) => {
          // You could store instance if needed
        }
      }
    });
  }

  public confirmSchedule(scheduledDate?: Date): void {
    this.isLoading = true;
    const payload = {
      assessmentId: String(this.assessmentId),
      candidateIds: this.pendingScheduleCandidateIds,
      assessmentRoundId: this.currentStep,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null
    };

    this.assessmentService
      .createEntity(payload, 'schedule')
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res: any) => {
          if (this.isAptitudeRound() && res && res.isSuccess === false && res.mismatchedCandidates?.length > 0) {
            this.handleScheduleMismatch(res);
            return;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Interviews scheduled successfully',
          });
          this.selectedCandidateIds = [];
          this.getPaginatedCandidateData(this.filterMap);
          this.ref?.close();
        },
        error: (err) => {
          const errorBody = err.error;
          if (this.isAptitudeRound() && errorBody && errorBody.isSuccess === false && errorBody.mismatchedCandidates?.length > 0) {
            this.handleScheduleMismatch(errorBody);
            return;
          }
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.type || err.error?.message || 'Failed to schedule interviews',
          });
          this.ref?.close();
        },
      });
  }

  private handleScheduleMismatch(errorBody: any): void {
    this.ref?.close(); // Close any currently open scheduling dialog first
    
    this.ref = this.dialog.open(ScheduleMismatchComponent, {
      showHeader: false,
      width: '520px',
      modal: true,
      focusOnShow: false,
      styleClass: 'standard-dialog-wrapper',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      data: {
        mismatchedCandidates: errorBody.mismatchedCandidates,
        onSubmit: (newDate: Date) => {
          this.confirmSchedule(newDate);
        }
      }
    });
  }

  public rejectSchedule(): void {
    this.confirmationService.close();
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.filterMap = {
      assessmentId: this.assessmentId,
      assessmentRoundId: this.currentStep ?? 0,
      ...payload.filterMap,
    };

    if (payload.pagination) {
      this.filterMap['pagination'] = payload.pagination as any;
    }
    
    if (payload.multiSortedColumns) {
      this.filterMap['multiSortedColumns'] = payload.multiSortedColumns as any;
    }

    this.getPaginatedCandidateData(this.filterMap);
  }

  public deleteCandidate(candidate: any): void {
    // Implement delete logic if needed, or leave it empty if not used
  }

  public onView(candidate: any): void {
    if (candidate.interviewId) {
      this.router.navigate(
        [`admin/recruitments/candidateDetail/${this.assessmentId}/${candidate.id}/${candidate.interviewId}`],
        { queryParams: { assessmentRoundId: this.currentStep } },
      );
    } else {
      this.router.navigate(
        [`admin/recruitments/candidateDetail/${this.assessmentId}/${candidate.id}`],
        { queryParams: { assessmentRoundId: this.currentStep } },
      );
    }
  }

  public unlockCandidate(candidate: any): void {
    this.isLoading = true;
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Candidate unlocked successfully',
      });
      this.getPaginatedCandidateData(this.filterMap);
    };
    const error = () => (this.isLoading = false);
    this.candidateService
      .activateTerminatedCandidate(candidate.id, this.assessmentId)
      .subscribe({ next, error });
  }

  public CompleteAssessmentRound(): void {
    if (!this.currentStep || this.hasUncompletedPreviousRound()) return;

    this.isCompletingRound = true;
    this.assessmentService.getAssessmentRoundByAssessmnetId(this.assessmentId)
      .pipe(finalize(() => this.isCompletingRound = false))
      .subscribe({
        next: (rounds: AssessmentRound[]) => {
          const currentRound = rounds.find(r => r.id === this.currentStep);
          const currentIndex = rounds.findIndex(r => r.id === this.currentStep);
          const nextRound = rounds[currentIndex + 1];
          this.nextRoundId = nextRound ? nextRound.id : null;

          if (currentRound) {
            const pendingCandidates = this.tableData?.data?.filter((c: any) => {
              const status = c.status?.toLowerCase();
              return status !== 'selected' && status !== 'rejected';
            }) || [];

            if (pendingCandidates.length > 0) {
              this.ref = this.dialog.open(RoundCompletionWarningComponent, {
                showHeader: false,
                styleClass: 'standard-dialog-wrapper',
                width: '450px',
                modal: true,
                breakpoints: {
                  '640px': '90vw',
                },
                data: {
                  roundName: currentRound.round,
                  isLastRound: !nextRound,
                  candidates: pendingCandidates,
                  warningType: 'pending'
                }
              });
            } else if (nextRound && (this.tableData?.data?.filter((c: any) => c.status?.toLowerCase() === 'selected' && !c.isScheduled) || []).length > 0) {
              const unscheduledCandidates = this.tableData?.data?.filter((c: any) => c.status?.toLowerCase() === 'selected' && !c.isScheduled) || [];
              this.ref = this.dialog.open(RoundCompletionWarningComponent, {
                showHeader: false,
                styleClass: 'standard-dialog-wrapper',
                width: '450px',
                modal: true,
                breakpoints: {
                  '640px': '90vw',
                },
                data: {
                  roundName: currentRound.round,
                  isLastRound: false,
                  candidates: unscheduledCandidates,
                  warningType: 'unscheduled'
                }
              });
            } else {
              const modalData = {
                message: `Are you sure you want to complete the ${currentRound.round}? Once completed, this action cannot be undone.`,
                isChoice: true,
                cancelButtonText: 'Cancel',
                acceptButtonText: 'Complete',
              };

              this.ref = this.dialog.open(DialogComponent, {
                data: modalData,
                header: 'Confirm Round Completion',
                maximizable: false,
                width: '400px',
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

              this.ref.onClose.subscribe((confirmed: boolean) => {
                if (confirmed) {
                  this.executeRoundCompletion();
                }
              });
            }
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch round details'
          });
        }
      });
  }

  public currentHistoryPanelName: string | null = null;

  public viewHistory(candidate: any): void {
    this.historyPagination.candidateId = candidate.id;
    this.currentHistoryInterviewId = candidate.interviewId;
    this.currentHistoryPanelName = candidate.panelMemberName || candidate.panelName || null;
    this.historyPagination.pageNumber = 1;
    this.events = [];
    this.visible = true;
    this.fetchInterviewHistory();
  }

  public loadMoreHistory() {
    this.historyPagination.pageNumber++;
    this.fetchInterviewHistory();
  }

  private fetchInterviewHistory() {
    this.historyLoading = true;
    const payload = new PaginatedPayload();
    payload.pagination.pageNumber = this.historyPagination.pageNumber;
    payload.pagination.pageSize = this.historyPagination.pageSize;
    payload.filterMap = {
      assessmentRoundId: Number(this.currentStep),
      interviewId: this.currentHistoryInterviewId || ''
    };

    payload.multiSortedColumns = [{ active: 'ChangedAt', direction: 'desc' }];

    this.interviewService.getInterviewHistory(payload)
      .pipe(finalize(() => this.historyLoading = false))
      .subscribe({
        next: (res: any) => {
          let sortedData = [...res.data];
          // Fix logical order: "Status Updated" to Selected should logically happen AFTER "Score Added", so it should appear above it in desc order.
          sortedData.sort((a, b) => {
            const timeA = new Date(a.changedAt + (a.changedAt.endsWith('Z') ? '' : 'Z')).getTime();
            const timeB = new Date(b.changedAt + (b.changedAt.endsWith('Z') ? '' : 'Z')).getTime();
            // If they are less than 15 minutes apart, force Status Updated to be "newer" than Score Added
            if (Math.abs(timeA - timeB) < 15 * 60 * 1000) {
              if (a.action === 'Status Updated' && b.action === 'Score Added') return -1;
              if (b.action === 'Status Updated' && a.action === 'Score Added') return 1;
            }
            return timeB - timeA; // default descending
          });

          const newEvents = sortedData.map((item: any) => ({
            status: this.formatAction(item.action),
            user: (item.action === 'Score Added' && this.currentHistoryPanelName) ? this.currentHistoryPanelName : item.changedByName,
            date: new Date(item.changedAt ? item.changedAt + (item.changedAt.endsWith('Z') ? '' : 'Z') : new Date()),
            icon: this.getHistoryIcon(item.action),
            description: this.getHistoryDescription(item)
          }));
          this.events = this.historyPagination.pageNumber === 1 ? newEvents : [...this.events, ...newEvents];
          this.historyPagination.totalRecords = res.totalRecords;
        },
      });
  }

  private formatAction(action: string): string {
    if (!action) return 'Unknown';
    return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
  }

  private getHistoryIcon(action: string): string {
    switch (action?.toLowerCase()) {
      case 'selected': return 'pi pi-check-circle';
      case 'rejected': return 'pi pi-times-circle';
      case 'scheduled': return 'pi pi-calendar';
      case 'pending': return 'pi pi-clock';
      default: return 'pi pi-info-circle';
    }
  }

  private getHistoryDescription(item: any): string {
    if (item.details) return item.details;
    if (item.remarks) return item.remarks;
    if (item.field) {
      const formatVal = (v: any) => v === '' || v === null || v === undefined ? 'null' : v;
      return `${item.field}: ${formatVal(item.previousValue)} → ${formatVal(item.currentValue)}`;
    }
    return `Action performed by ${item.changedByName}`;
  }

  public openMenu(event: Event, menu: Menu): void {
    const selectedCandidates = this.tableData?.data?.filter((c: any) => this.selectedCandidateIds.includes(c.id)) || [];
    const movedCandidates = selectedCandidates.filter((c: any) => c.status?.toLowerCase() === 'selected' && c.isScheduled);

    if (movedCandidates.length > 0) {
      const candidateNamesArray = movedCandidates.map((c: any) => c.name || c.candidateName || c.fullName || 'Unknown Candidate');
      
      const modalData = {
        title: 'Action Not Allowed',
        message: 'The following candidate(s) have already been shortlisted for the next round. Modifications to their status in the current round are no longer permitted.',
        candidateNames: candidateNamesArray,
        isChoice: false,
        acceptButtonText: 'Ok',
      };

      this.ref = this.dialog.open(DialogComponent, {
        data: modalData,
        showHeader: false,
        styleClass: 'standard-dialog-wrapper',
        maximizable: false,
        width: '450px',
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
      return;
    }

    this.updateActionItems();
    menu.toggle(event);
  }

  public updateActionItems(): void {
    const isAptitude = this.isAptitudeRound();
    const selectedRound = this.step?.[this.activeMenuItemIndex];
    const roundTypeId = selectedRound?.roundTypeId;
    const roundName = selectedRound?.round?.toLowerCase() || '';
    const isPanel = roundTypeId === 2 || String(roundTypeId) === '2' || roundName.includes('panel') || roundName.includes('interview');

    const hasSelection = this.selectedCandidateIds.length > 0;
    
    // Get the selected candidates' detailed data to check scheduling status
    const selectedCandidates = this.tableData?.data?.filter((c: any) => this.selectedCandidateIds.includes(c.id)) || [];

    const allCompleted = selectedCandidates.length > 0 && selectedCandidates.every((c: any) => c.status?.toLowerCase() === 'completed');
    const allSelected = selectedCandidates.length > 0 && selectedCandidates.every((c: any) => c.status?.toLowerCase() === 'selected');
    const allRejected = selectedCandidates.length > 0 && selectedCandidates.every((c: any) => c.status?.toLowerCase() === 'rejected');
    const allQuit = selectedCandidates.length > 0 && selectedCandidates.every((c: any) => c.status?.toLowerCase() === 'quit');

    const anyCompleted = selectedCandidates.some((c: any) => c.status?.toLowerCase() === 'completed');
    const anySelected = selectedCandidates.some((c: any) => c.status?.toLowerCase() === 'selected');
    const anyRejected = selectedCandidates.some((c: any) => c.status?.toLowerCase() === 'rejected');
    const anyQuit = selectedCandidates.some((c: any) => c.status?.toLowerCase() === 'quit');
    const anyScheduled = selectedCandidates.some((c: any) => c.isScheduled);
    const anyOnReview = selectedCandidates.some((c: any) => {
      const status = c.status?.toLowerCase() || '';
      return status === 'on review' || status === 'onreview' || status === 'under review' || status.includes('review');
    });

    const anyMissingBatch = isAptitude && selectedCandidates.some((c: any) => !c.batch || c.batch === '-' || String(c.batch).trim() === '' || String(c.batch).toLowerCase().includes('unassigned'));
    const anyMissingPanel = isPanel && selectedCandidates.some((c: any) => !c.panel || c.panel === '-' || String(c.panel).trim() === '' || String(c.panel).toLowerCase().includes('unassigned'));

    const items: MenuItem[] = [];

    if (isAptitude) {
      items.push({
        label: 'Assign to Batch',
        icon: 'pi pi-users',
        disabled: !hasSelection || anyCompleted || anyScheduled || anySelected || anyRejected || anyOnReview || anyQuit,
        command: () => this.onAssignToBatch({ id: '' }), // Passing empty id as it's bulk/header action
      });
    }

    if (isPanel) {
      items.push({
        label: 'Assign to Panel',
        icon: 'pi pi-user-plus',
        disabled: !hasSelection || anyCompleted || anySelected || anyRejected || anyOnReview || anyQuit || this.selectedCandidateIds.length > 1,
        command: () => this.onAssignToPanel(),
      });
    }

    items.push({
      label: 'Schedule',
      icon: 'pi pi-calendar-plus',
      disabled: !hasSelection || anyCompleted || anyScheduled || anySelected || anyRejected || anyOnReview || anyQuit || anyMissingBatch || anyMissingPanel,
      command: () => this.onScheduleCandidate({ id: this.selectedCandidateIds.join(',') }),
    });

    items.push({
      label: 'Select Candidate',
      icon: 'pi pi-check-circle',
      disabled: !hasSelection || (!allCompleted && !allRejected),
      command: () => this.onSelectCandidates(),
    });

    items.push({
      label: 'Reject Candidate',
      icon: 'pi pi-times-circle',
      disabled: !hasSelection || (!allCompleted && !allSelected && !allQuit),
      command: () => this.onRejectCandidates(),
    });

    const hasNextRound = this.activeMenuItemIndex < (this.step?.length || 0) - 1;
    if (hasNextRound) {
      items.push({
        label: 'Move to Next Round',
        icon: 'pi pi-forward',
        disabled: !hasSelection || !allSelected || anyScheduled,
        command: () => this.onMoveToNextRound(),
      });
    }

    this.actionItems = items;
  }

  public onSelectCandidates(): void {
    if (this.selectedCandidateIds.length === 0) return;

    const modalData = {
      message: `Are you sure you want to select the ${this.selectedCandidateIds.length} selected candidate(s)?`,
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Select',
    };

    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Confirm Selection',
      maximizable: false,
      width: '400px',
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
        this.updateBulkCandidateStatus(8, 'selected');
      }
    });
  }

  public onRejectCandidates(): void {
    if (this.selectedCandidateIds.length === 0) return;

    const modalData = {
      message: `Are you sure you want to reject the ${this.selectedCandidateIds.length} selected candidate(s)?`,
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Reject',
    };

    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Confirm Rejection',
      maximizable: false,
      width: '400px',
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
        this.updateBulkCandidateStatus(9, 'rejected');
      }
    });
  }

  private updateBulkCandidateStatus(statusId: number, actionName: string): void {
    if (this.selectedCandidateIds.length === 0 || !this.assessmentId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No candidates selected or missing assessment information.',
      });
      return;
    }

    const payload = this.selectedCandidateIds.map(candidateId => ({
      candidateId: candidateId,
      assessmentRoundId: Number(this.currentStep),
      isActive: true,
      statusId: statusId,
      assessmentId: Number(this.assessmentId),
    }));

    this.isLoading = true;

    const next = () => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail:
          actionName === 'selected'
            ? 'Selected candidate(s) successfully'
            : 'Rejected candidate(s) successfully',
      });
      // Clear selections
      this.selectedCandidateIds = [];
      this.updateActionItems();
      // Refresh candidates list and summary
      this.getAssessmentSummaryData(Number(this.assessmentId));
      this.getPaginatedCandidateData(this.filterMap);
    };

    const error = () => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          actionName === 'selected'
            ? 'Failed to select candidate(s). Please try again.'
            : 'Failed to reject candidate(s). Please try again.',
      });
    };

    this.interviewService
      .updateEntity('InterviewStatus', payload)
      .subscribe({ next, error });
  }

  public onMoveToNextRound(): void {
    if (this.selectedCandidateIds.length === 0) return;

    this.isLoading = true;
    const payload = {
      assessmentId: this.assessmentId,
      candidateIds: this.selectedCandidateIds
    };

    this.assessmentService.createEntity(payload, 'move-to-next-round')
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Candidates moved to the next round successfully'
            });
            this.selectedCandidateIds = [];
            this.getPaginatedCandidateData(this.filterMap);
            this.getAssessmentSummaryData(this.assessmentId);
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: 'No candidates were moved. Ensure they are selected and a next round exists.'
            });
          }
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.type || err.error?.message || 'Failed to move candidates'
          });
        }
      });
  }

  // Private Methods
  private executeRoundCompletion(): void {
    this.isCompletingRound = true;
    const payload = {
      assessmentId: Number(this.assessmentId),
      assessmentRoundId: Number(this.currentStep),
    };

    this.assessmentService.updateEntity(undefined, payload, 'assessmentRound/assessmentRoundComplete')
      .pipe(finalize(() => this.isCompletingRound = false))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Round completed successfully',
          });
          this.getAssessmentDetails(this.assessmentId);
          this.getAssessmentRoundDetails(this.assessmentId);
          this.getAssessmentSummaryData(this.assessmentId);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.type || err.error?.message || 'Failed to complete round',
          });
        }
      });
  }

  private onScheduleRecruitment(): void {
    this.router.navigate([`admin/recruitments/schedule/${this.assessmentId}`]);
  }

  private onImportCandidates(): void {
    this.router.navigate([`admin/recruitments/schedule/${this.assessmentId}`]);
  }

  private getAssessmentDetails(id: number): void {
    const next = (res: Assessment) => {
      this.normalizeDates(res);
      this.data = res;
      this.isAllRoundsCompleted = res.statusId === StatusEnum.Completed;
      this.cdr.detectChanges();
    };
    const error = () => { };
    this.assessmentService.getEntityById(id).subscribe({ next, error });
  }

  /**
   * Normalizes assessment dates to ensure they are in a format compatible with Angular date pipe.
   * Also handles fallback property names (startDate/endDate).
   */
  private normalizeDates(assessment: any): void {
    if (!assessment) return;

    // Map fallback property names if necessary
    if (assessment.startDate && !assessment.startDateTime) {
      assessment.startDateTime = assessment.startDate;
    }
    if (assessment.endDate && !assessment.endDateTime) {
      assessment.endDateTime = assessment.endDate;
    }

    // Parse DD-MM-YYYY format to ISO if needed
    if (assessment.startDateTime) {
      assessment.startDateTime = this.parseDate(assessment.startDateTime) || assessment.startDateTime;
    }
    if (assessment.endDateTime) {
      assessment.endDateTime = this.parseDate(assessment.endDateTime) || assessment.endDateTime;
    }
  }

  private parseDate(date: string): string | null {
    if (!date) return null;

    // Check for DD-MM-YYYY format
    const parts = date.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      const customDate = new Date(year, month, day);

      if (
        customDate.getFullYear() === year &&
        customDate.getMonth() === month &&
        customDate.getDate() === day
      ) {
        return customDate.toISOString();
      }
    }

    // Fallback to native parsing for ISO strings
    const isoDate = new Date(date);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toISOString();
    }

    return null;
  }

  private getAssessmentRoundDetails(id: number): void {
    this.isLoading = true;
    const next = (res: AssessmentRound[]) => {
      this.step = res.sort((a, b) => a.sequence - b.sequence);
      if (this.step.length > 0) {
        const activeIndex = this.step.findIndex(s => s.status !== 'Completed');
        const initialIndex = activeIndex !== -1 ? activeIndex : 0;
        
        this.activeMenuItemIndex = initialIndex;
        this.currentStep = this.step[initialIndex].id;
        this.roundStatus = this.step[initialIndex].status === 'Completed';

        // Update columns based on the first round's type
        this.updateTableColumns(this.step[initialIndex].roundTypeId);

        // Set initial selectedGuideTab based on the first round's type
        const initialRound = this.step[initialIndex];
        const roundName = initialRound?.round?.toLowerCase() || '';
        const roundTypeId = initialRound?.roundTypeId;
        const isAptitude = roundTypeId === 1 || roundName.includes('aptitude') || roundName.includes('test');
        this.selectedGuideTab = isAptitude ? 'aptitude' : 'interview';

        this.filterMap = {
          assessmentId: this.assessmentId,
          assessmentRoundId: this.currentStep,
        };
        this.getPaginatedCandidateData(this.filterMap);
      } else {
        this.isLoading = false;
      }
      this.cdr.detectChanges();
    };
    const error = () => {
      this.isLoading = false;
      this.cdr.detectChanges();
    };
    this.assessmentService.getAssessmentRoundByAssessmnetId(id).subscribe({ next, error });
  }

  private getPaginatedCandidateData(payload: FilterMap): void {
    this.isLoading = true;
    const paginatedPayload = new PaginatedPayload();
    const filterMapCopy = { ...payload };
    
    if (filterMapCopy['pagination']) {
       paginatedPayload.pagination = filterMapCopy['pagination'] as any;
       delete filterMapCopy['pagination'];
    }

    if (filterMapCopy['multiSortedColumns']) {
       paginatedPayload.multiSortedColumns = filterMapCopy['multiSortedColumns'] as any;
       delete filterMapCopy['multiSortedColumns'];
    }

    paginatedPayload.filterMap = filterMapCopy;

    this.interviewService.paginationEntity<any>('InterviewSummary', paginatedPayload)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: PaginatedData<any>) => {
          this.tableData = {
            ...res,
            data: res.data.map((item: any) => ({
              id: item.candidateId || item.id,
              name: item.candidateName || item.fullName || item.name || 'Unknown',
              email: item.email,
              score: ((item.score === 0 || item.score === '0') && !['completed', 'on review', 'selected', 'rejected'].includes(item.status?.toLowerCase() || '')) ? 'N/A' : (item.score === 0 || item.score === '0' ? item.score : (item.score || 'N/A')),
              status: item.status || 'Pending',
              nextRoundStatus: (item.isScheduled === true || (typeof item.isScheduled === 'string' && item.isScheduled.toLowerCase() !== 'false' && item.isScheduled.toLowerCase() !== 'not scheduled' && item.isScheduled.trim() !== '')) ? 'Scheduled' : 'Not scheduled',
              interviewDate: item.scheduledDate || 'Not Scheduled',
              isScheduled: item.isScheduled === true || (typeof item.isScheduled === 'string' && item.isScheduled.toLowerCase() !== 'false' && item.isScheduled.toLowerCase() !== 'not scheduled' && item.isScheduled.trim() !== ''),
              scheduledDate: item.scheduledDate || 'Not Scheduled',
              assessmentRoundId: item.assessmentRoundId,
              interviewId: item.id || item.interviewId,
              batch: item.batchName || item.batch || 'Unassigned',
              batchId: item.batchId,
              panel: item.panel || item.Panel || 'Unassigned to Panel',
              questionSet: item.questionSetName || item.questionSet || 'Unassigned',
              visibleButtonIndices: this.getVisibleButtonIndices(item)
            })),
          };
        },
      });
  }

  private getVisibleButtonIndices(item: any): number[] {
    const indices = [0, 2]; // View and History are always visible

    // Unlock (1) is only visible if status is Terminated
    if (item.status?.toLowerCase() === 'terminated') {
      indices.push(1);
    }

    return indices;
  }

  private getAssessmentSummaryData(id: number): void {
    this.interviewService.getAssessmentSummary(id).subscribe({
      next: (res: any) => {
        if (res) {
          // Use the exact nested structure provided by the backend
          const summary = res.overallSummary || {};
          this.summaryStats = {
            total: summary.totalCandidates || 0,
            selected: summary.totalSelected || 0,
            rejected: summary.totalRejected || 0,
            pending: summary.totalPending || 0,
          };
          
          // Map the roundWisePerformance array
          const rounds = res.roundWisePerformance || [];
          this.roundPerformanceData = rounds.map((round: any) => {
            const attended = round.attended || 0;
            const invited = round.invited || round.totalScheduled || 0;
            const selected = round.selected || 0;
            const rejected = round.rejected || 0;
            const pending = round.pending || 0;
            
            // Calculate completion percentage based on attended vs invited/totalScheduled
            const completionPercentage = invited > 0 ? Math.round((attended / invited) * 100) : 0;

            return {
              name: round.roundName,
              status: round.status || 'Pending',
              statusClass: (round.status === 'Completed') 
                ? 'status-active' // Using CSS class from scss line 519
                : (round.status === 'Progress' ? 'status-progress' : 'status-queued'),
              statLabel: 'Attendance Rate',
              statValue: `${completionPercentage}%`,
              progress: completionPercentage,
              selected: selected,
              rejected: rejected,
              pending: pending,
              scheduled: round.scheduled || 0,
              totalScheduled: round.totalScheduled || 0,
              isAllScheduled: (round.scheduled || 0) === (round.totalScheduled || 0) && round.totalScheduled > 0
            };
          });
        }
        this.cdr.detectChanges();
      }
    });
  }

  private setSidebarConfig(): void {
    this.sidebarConfig = [
      {
        items: [
          {
            label: 'Summary',
            icon: 'pi pi-home',
            command: () => {
              this.activeMenuItem = 0;
              this.filterMap = {
                assessmentId: this.assessmentId,
                assessmentRoundId: this.currentStep || 0,
              };
              this.getPaginatedCandidateData(this.filterMap);
            },
          },
        ],
      },
    ];
  }
}
