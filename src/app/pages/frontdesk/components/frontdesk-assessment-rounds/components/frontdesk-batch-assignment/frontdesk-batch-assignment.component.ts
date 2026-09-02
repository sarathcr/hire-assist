import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AccordionModule, AccordionTabOpenEvent } from 'primeng/accordion';
import { MenuItem, MessageService } from 'primeng/api';
import { ChipModule } from 'primeng/chip';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs/operators';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { TableSkeletonComponent } from '../../../../../../shared/components/table/table.skeleton';
import { ASSESSMENT_URL } from '../../../../../../shared/constants/api';
import { StatusEnum } from '../../../../../../shared/enums/status.enum';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import {
  FilterMap,
  PaginatedData,
  PaginatedPayload,
} from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { MarkAsPresentRequest } from '../../../../../admin/models/question.model';
import { AssessmentService } from '../../../../../admin/services/assessment.service';
import { InterviewService } from '../../../../../admin/services/interview.service';
import { AssignBatchDialogComponent } from '../assign-batch-dialog/assign-batch-dialog.component';
import { UploadIdProofDialogComponent } from '../upload-id-proof-dialog/upload-id-proof-dialog.component';
import { FrontdeskBatchAssignmentSkeletonComponent } from './frontdesk-batch-assignment-skeleton.component';
// Columns used in the batch (Aptitude) accordion view
const aptitudeTableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Name',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      fieldType: FieldType.inputtext,
    },
    {
      field: 'email',
      displayName: 'Email',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      fieldType: FieldType.inputtext,
    },
    {
      field: 'scheduledDate',
      displayName: 'Scheduled Date',
      sortedColumn: true,
      hasChip: false,
      fieldType: FieldType.StringToDateTime,
    },
    {
      field: 'reportingTime',
      displayName: 'Reported Time',
      sortedColumn: true,
      hasChip: false,
      fieldType: FieldType.StringToDateTime,
    },
    {
      field: 'status',
      displayName: 'Status',
      sortedColumn: true,
      hasTextFilter: true,
      filterAlias: 'statusFilter',
      hasMultiStatus: true,
      filterOptions: [
        { label: 'Enrolled', value: 'Enrolled' },
        { label: 'Not Enrolled', value: 'Not Enrolled' },
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'Assigned', value: 'Assigned' },
        { label: 'Selected', value: 'Selected' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Active', value: 'Active' },
        { label: 'Absent', value: 'Absent' },
        { label: 'Quit', value: 'Quit' },
        { label: 'Not Attended', value: 'Not Attended' },
      ],
    },
    {
      field: 'button',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      buttonTooltips: [
        'Mark as Present',
        'Mark as Absent',
        'Assign to another batch',
        'Upload Id Proof',
      ],
      buttonIcons: [
        'pi pi-check',
        'pi pi-times',
        'pi pi-arrows-v',
        'pi pi-id-card',
      ],
      buttonLabels: [
        'Mark as Present',
        'Mark as Absent',
        'Assign to Batch',
        'Upload ID Proof',
      ],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: [],
};

// Columns used for non-aptitude (Interview / Panel) grouped table view
const nonAptitudeTableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Name',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      fieldType: FieldType.inputtext,
    },
    {
      field: 'email',
      displayName: 'Email',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      fieldType: FieldType.inputtext,
    },
    {
      field: 'scheduledDate',
      displayName: 'Scheduled Date',
      sortedColumn: true,
      hasChip: false,
      fieldType: FieldType.StringToDateTime,
    },
    {
      field: 'reportingTime',
      displayName: 'Reported Time',
      sortedColumn: true,
      hasChip: false,
      fieldType: FieldType.StringToDateTime,
    },
    {
      field: 'status',
      displayName: 'Status',
      sortedColumn: true,
      hasTextFilter: true,
      filterAlias: 'statusFilter',
      hasMultiStatus: true,
      filterOptions: [
        { label: 'Enrolled', value: 'Enrolled' },
        { label: 'Not Enrolled', value: 'Not Enrolled' },
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'Assigned', value: 'Assigned' },
        { label: 'Selected', value: 'Selected' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Active', value: 'Active' },
        { label: 'Absent', value: 'Absent' },
        { label: 'Quit', value: 'Quit' },
        { label: 'Not Attended', value: 'Not Attended' },
      ],
    },
    {
      field: 'button',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      buttonTooltips: [
        'Mark as Present',
        'Mark as Absent',
        'Assign to another batch',
        'Upload Id Proof',
      ],
      buttonIcons: [
        'pi pi-check',
        'pi pi-times',
        'pi pi-arrows-v',
        'pi pi-id-card',
      ],
      buttonLabels: [
        'Mark as Present',
        'Mark as Absent',
        'Assign to Batch',
        'Upload ID Proof',
      ],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: [],
};

export interface Candidate {
  id: string;
  name: string;
  email: string;
  reportingTime: string;
  statusId?: number;
  status?: string;
  batchQuestionSetsId?: string;
  toggleTooltipIconIndex?: number;
  visibleButtonIndices?: number[];
  disabledButtonIndices?: number[];
  candidateId?: string;
  isDisabled?: boolean;
  isActionsDisabled?: boolean;
  disabledReason?: string;
}

export interface ButtonAction {
  fName: string;
  event: Candidate;
}

export interface Batch {
  id: string;
  name: string;
  scheduledTime: string;
  startDate?: Date;
}

export interface AssignToAnotherBatchDialogData {
  batch: string;
}

export interface NonAptitudeCandidate {
  id: string;
  name: string;
  email: string;
  status?: string;
  statusId?: number;
  /** Panel name returned by InterviewSummary for non-aptitude rounds */
  panel?: string;
  score?: number;
  isScheduled?: boolean;
}

@Component({
  selector: 'app-frontdesk-batch-assignment',
  imports: [
    AccordionModule,
    TableComponent,
    CommonModule,
    ChipModule,
    FrontdeskBatchAssignmentSkeletonComponent,
    TableSkeletonComponent,
  ],
  templateUrl: './frontdesk-batch-assignment.component.html',
  styleUrl: './frontdesk-batch-assignment.component.scss',
  providers: [TableDataSourceService],
})
export class FrontdeskBatchAssignmentComponent implements OnInit {
  public sidebarConfig!: MenuItem[];
  public selectedView: 0 | 1 = 0;
  /** Columns for aptitude (batch) view */
  public aptitudeColumns: TableColumnsData = aptitudeTableColumns;
  /** Columns for non-aptitude (flat) view */
  public nonAptitudeColumns: TableColumnsData = nonAptitudeTableColumns;
  public assessmentId!: number;
  public assessmentRoundId!: number;
  public batchId!: number;
  public candidatesByBatch: Record<string, PaginatedData<Candidate>> = {};

  public batchList!: Batch[];
  public candidatesList!: PaginatedData<Candidate>;
  public markAsPresentRequest!: MarkAsPresentRequest;
  private ref: DynamicDialogRef | undefined;
  public isLoading: boolean = true;
  public loadingBatches: Record<string, boolean> = {};

  /** null = still detecting, true = aptitude (batch), false = non-aptitude */
  public isAptitudeRound: boolean | null = null;
  public currentRoundName: string = '';

  /** Data for non-aptitude flat table */
  public nonAptitudeCandidates!: PaginatedData<Candidate>;
  public isNonAptitudeLoading: boolean = false;

  private readonly ALLOWED_ACTION_STATUSES = [
    StatusEnum.Active,
    StatusEnum.Scheduled,
  ];

  public filterMap!: FilterMap;

  constructor(
    public dialog: DialogService,
    public messageService: MessageService,
    private route: ActivatedRoute,
    private assessmentService: AssessmentService,
    private interviewService: InterviewService,
    private dataSourceService: TableDataSourceService<Candidate>,
  ) {}

  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getCurrentRouteIds();
    this.detectRoundType();
  }

  public onButtonClick($event: ButtonAction, batchId: string) {
    if (
      $event.fName === 'Mark as Present' ||
      $event.fName === 'Mark as Absent'
    ) {
      this.markAsPresent($event.event, batchId, $event.fName);
    } else if ($event.fName === 'Assign to another batch') {
      this.assignToAnotherBatch($event.event, batchId);
    } else if ($event.fName === 'Upload Id Proof') {
      this.uploadIdProof($event.event);
    }
  }
  public getAllCandidates(batchId: string) {
    const payload = new PaginatedPayload();
    this.getAllPaginatedCandidates(payload, batchId);
  }

  public loadCandidatesForBatch(
    payload: PaginatedPayload,
    batchId: string,
  ): void {
    if (!this.candidatesByBatch[batchId]) {
      this.loadingBatches[batchId] = true;
      this.getAllPaginatedCandidates(payload, batchId);
    }
  }

  private markAsPresent(candidate: Candidate, batchId: string, event?: string) {
    this.markAsPresentRequest = { InterviewsId: candidate.id };
    // Show loading skeleton while API call is in progress
    this.loadingBatches[batchId] = true;

    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Candidate ${candidate.name} ${event}`,
      });
      // Refresh candidates data after successful API call
      this.refreshData(batchId);
    };

    const error = (error: CustomErrorResponse) => {
      this.loadingBatches[batchId] = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error.type,
      });
    };
    this.assessmentService
      .markasPresent(this.markAsPresentRequest)
      .subscribe({ next, error });
  }

  private assignToAnotherBatch(candidate: Candidate, batchId: string) {
    const filteredBatchList = this.batchList.filter(
      (batch) => batch.id !== batchId,
    );

    this.ref = this.dialog.open(AssignBatchDialogComponent, {
      data: filteredBatchList,
      header: 'Assign to another batch',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((result: AssignToAnotherBatchDialogData) => {
      if (!result) {
        return;
      }

      const targetBatchId = (result as AssignToAnotherBatchDialogData).batch;

      const next = () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Candidate ${candidate.name} assigned to another batch successfully`,
        });
        this.refreshData(batchId);
        if (targetBatchId) {
          this.refreshData(targetBatchId);
        }
      };

      const error = (error: CustomErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error.type,
        });
      };

      this.assessmentService
        .assignToAnotherBatch({
          BatchQuestionSetId: candidate.batchQuestionSetsId!,
          BatchId: targetBatchId,
        })
        .subscribe({ next, error });
    });
  }

  private uploadIdProof(candidate: Candidate) {
    // Open modal instantly - API call will happen inside the dialog component
    this.openUploadDialog(candidate);
  }

  private openUploadDialog(candidate: Candidate) {
    const batchId = candidate.batchQuestionSetsId;
    this.ref = this.dialog.open(UploadIdProofDialogComponent, {
      data: {
        candidateEmail: candidate.email,
        candidateId: candidate.id,
      },
      header: 'Upload ID Proof',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      styleClass: 'frontdeskIdproof__Dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((result: { success?: boolean } | undefined) => {
      // Modal handles upload internally, refresh candidate data if upload was successful
      if (result?.success && batchId) {
        this.refreshData(batchId);
      }
    });
  }

  private getCurrentRouteIds() {
    this.route.paramMap.subscribe((params) => {
      this.assessmentRoundId = params.get('id')! as unknown as number;
      this.assessmentId = params.get('recruitmentId')! as unknown as number;
    });
  }

  /**
   * Fetches assessment rounds to identify if the current round is an Aptitude round.
   */
  private detectRoundType(): void {
    this.isLoading = true;
    this.isAptitudeRound = null;

    this.assessmentService
      .getAssessmentRoundsForFrontDesk(this.assessmentId)
      .subscribe({
        next: (rounds: any[]) => {
          const currentRound = rounds.find(
            (r) => r.id === Number(this.assessmentRoundId),
          );

          if (currentRound) {
            this.currentRoundName = currentRound.name;
            const roundName = currentRound.name?.toLowerCase() || '';
            const isAptitude = roundName.includes('aptitude');

            if (isAptitude) {
              this.isAptitudeRound = true;
              this.getAllBatches();
            } else {
              this.isAptitudeRound = false;
              this.loadNonAptitudeCandidates(new PaginatedPayload());
              this.isLoading = false;
            }
          } else {
            // Fallback if round not found
            this.isAptitudeRound = false;
            this.loadNonAptitudeCandidates(new PaginatedPayload());
            this.isLoading = false;
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to identify round type.',
          });
        },
      });
  }

  private parseCustomDate(dateValue: string): string {
    if (dateValue.includes('/')) {
      const parts = dateValue.split(',');
      if (parts.length === 2) {
        const datePart = parts[0].trim();
        const timePart = parts[1].trim();
        const dateParts = datePart.split('/');
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          const year = dateParts[2];
          const timeParts = timePart.split(' ');
          if (timeParts.length === 2) {
            const hm = timeParts[0].split(':');
            let hours = parseInt(hm[0], 10);
            const minutes = hm[1].padStart(2, '0');
            const ampm = timeParts[1].toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            const hoursStr = hours.toString().padStart(2, '0');
            return `${year}-${month}-${day}T${hoursStr}:${minutes}:00Z`;
          }
        }
      }
    }
    return dateValue + (dateValue.endsWith('Z') ? '' : 'Z');
  }

  private getAllBatches(): void {
    this.isLoading = true;
    const next = (res: Batch[]) => {
      this.batchList = res.map(batch => {
        if (batch.scheduledTime && batch.scheduledTime.includes(' - ')) {
          const parts = batch.scheduledTime.split(' - ');
          if (parts.length === 2) {
            const startStr = this.parseCustomDate(parts[0].trim());
            const endStr = this.parseCustomDate(parts[1].trim());
            batch.startDate = new Date(startStr);
            const datePipe = new DatePipe('en-US');
            const format = 'dd/MM/yyyy, hh:mm a';
            const formattedStart = datePipe.transform(startStr, format) || parts[0].trim();
            const formattedEnd = datePipe.transform(endStr, format) || parts[1].trim();
            batch.scheduledTime = `${formattedStart} - ${formattedEnd}`;
          }
        }
        return batch;
      });
      this.isLoading = false;
    };

    const error = (err: CustomErrorResponse) => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error?.type ?? 'Failed to load batches.',
      });
    };

    this.assessmentService
      .getBatchesForFrontDesk(this.assessmentId, this.assessmentRoundId)
      .subscribe({ next, error });
  }

  /**
   * Loads all candidates for a non-aptitude round using the PaginatedCandidates endpoint.
   * BatchId is specifically excluded from this request.
   */
  public loadNonAptitudeCandidates(payload: PaginatedPayload): void {
    this.isNonAptitudeLoading = true;
    payload.filterMap = {
      ...payload.filterMap,
      assessmentId: this.assessmentId,
      assessmentRoundId: this.assessmentRoundId,
    };

    // Remove batchId if it accidentally exists in the payload from previous views
    delete payload.filterMap['batchId'];

    this.assessmentService
      .paginationEntity<Candidate>('PaginatedCandidates', payload)
      .subscribe({
        next: (res: PaginatedData<Candidate>) => {
          this.nonAptitudeCandidates = {
            ...res,
            data: res.data.map((candidate) => this.mapCandidateData(candidate)),
          };
          this.isNonAptitudeLoading = false;
        },
        error: (err: CustomErrorResponse) => {
          this.isNonAptitudeLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.type ?? 'Failed to load candidates.',
          });
        },
      });
  }

  public onNonAptitudeTablePayloadChange(payload: PaginatedPayload): void {
    this.loadNonAptitudeCandidates(payload);
  }

  public onAccordionOpen(event: AccordionTabOpenEvent): void {
    // In PrimeNG 18+, event.value contains the value of the panel (e.g. batch name)
    const selectedItemName = (event as any).value ?? event.index;

    if (this.isAptitudeRound) {
      const selectedBatch = this.batchList.find(
        (batch) =>
          batch.name === selectedItemName || batch.id === selectedItemName,
      );
      if (selectedBatch) {
        this.loadCandidatesForBatch(new PaginatedPayload(), selectedBatch.id);
      }
    }
  }

  private getAllPaginatedCandidates(
    payload: PaginatedPayload,
    batchId: string,
  ): void {
    payload.filterMap = {
      assessmentId: this.assessmentId,
      assessmentRoundId: this.assessmentRoundId,
      batchId: batchId,
    };

    const next = (res: PaginatedData<Candidate>) => {
      const updatedRes: PaginatedData<Candidate> = {
        ...res,
        data: res.data.map((candidate) => this.mapCandidateData(candidate, batchId)),
      };
      this.candidatesByBatch[batchId] = updatedRes;
      this.loadingBatches[batchId] = false;
    };

    const error = (error: CustomErrorResponse) => {
      this.loadingBatches[batchId] = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error.type,
      });
    };

    this.assessmentService
      .paginationEntity<Candidate>('PaginatedCandidates', payload)
      .subscribe({ next, error });
  }
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${ASSESSMENT_URL}/PaginatedCandidates`);
  }

  public onTablePayloadChange(
    payload: PaginatedPayload,
    batchId: string,
  ): void {
    this.loadData(payload, batchId);
  }
  /**
   * Refreshes the candidate list for a specific batch or round.
   */
  private refreshData(id: string): void {
    const payload = new PaginatedPayload();
    if (this.isAptitudeRound && id !== 'flat_view') {
      this.loadData(payload, id);
    } else {
      this.loadNonAptitudeCandidates(payload);
    }
  }

  private loadData(payload: PaginatedPayload, batchId: string): void {
    this.loadingBatches[batchId] = true;
    payload.filterMap = {
      ...payload.filterMap,
      assessmentId: this.assessmentId,
      assessmentRoundId: this.assessmentRoundId,
      batchId: batchId,
    };

    this.dataSourceService
      .getData(payload)
      .pipe(finalize(() => (this.loadingBatches[batchId] = false)))
      .subscribe({
        next: (response: PaginatedData<Candidate>) => {
          const updatedRes: PaginatedData<Candidate> = {
            ...response,
            data: response.data.map((candidate) =>
              this.mapCandidateData(candidate, batchId),
            ),
          };
          this.candidatesByBatch[batchId] = updatedRes;
        },
      });
  }

  private mapCandidateData(candidate: Candidate, batchId?: string): Candidate {
    const statusLower = candidate.status?.toLowerCase() || '';

    // Button indices: 0: Mark as Present, 1: Mark as Absent, 2: Assign to Batch, 3: Upload ID Proof
    if (statusLower === 'completed' || statusLower === 'selected' || statusLower === 'rejected' || statusLower === 'quit') {
      // Cannot change status anymore for completed/selected/rejected assessments
      return {
        ...candidate,
        visibleButtonIndices: [3],
        disabledButtonIndices: this.isAptitudeRound ? [0, 1, 2] : [0, 1],
      };
    }

    // Check if the candidate is assigned to a panel or a batch, and is not scheduled yet
    const hasPanelOrBatch = !!((candidate as any).panel || candidate.batchQuestionSetsId || batchId);
    const rawScheduled = (candidate as any).isScheduled;
    const isScheduled = rawScheduled === true ||
      (typeof rawScheduled === 'string' &&
        rawScheduled.toLowerCase() !== 'false' &&
        rawScheduled.toLowerCase() !== 'not scheduled' &&
        rawScheduled.trim() !== '') ||
      statusLower === 'scheduled' ||
      statusLower === 'rescheduled' ||
      statusLower === 'reported' ||
      statusLower === 'present' ||
      statusLower === 'not attended' ||
      statusLower === 'notattended' ||
      statusLower === 'absent' ||
      candidate.statusId === StatusEnum.NotAttended;

    if (hasPanelOrBatch && !isScheduled) {
      return {
        ...candidate,
        isActionsDisabled: true,
        disabledReason: 'Candidate interview is not scheduled yet',
        disabledButtonIndices: [0, 1, 2, 3]
      };
    }

    // Check if the batch is scheduled in the future
    let isFutureBatch = false;
    if (this.isAptitudeRound && batchId && this.batchList) {
      const batch = this.batchList.find(b => b.id === batchId);
      if (batch && batch.startDate) {
        isFutureBatch = batch.startDate > new Date();
      }
    }

    if (isFutureBatch) {
      return {
        ...candidate,
        isActionsDisabled: true,
        disabledReason: 'Check-in and batch actions will be enabled once the scheduled start time is reached.',
        disabledButtonIndices: [0, 1, 2, 3]
      };
    }

    // Check if the candidate's interview is scheduled on a future date
    const rawScheduledDate = (candidate as any).scheduledDate || (candidate as any).date || (candidate as any).interviewDate;
    if (rawScheduledDate) {
      let scheduledDate: Date | null = null;
      if (rawScheduledDate instanceof Date) {
        scheduledDate = isNaN(rawScheduledDate.getTime()) ? null : rawScheduledDate;
      } else {
        const dateStr = String(rawScheduledDate).trim();
        if (
          dateStr !== '' &&
          dateStr !== '0001-01-01T00:00:00' &&
          !dateStr.startsWith('0001-01-01') &&
          dateStr.toLowerCase() !== 'not scheduled'
        ) {
          // Check if DD/MM/YYYY or DD-MM-YYYY format
          const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          if (ddmmyyyyMatch) {
            const day = parseInt(ddmmyyyyMatch[1], 10);
            const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
            const year = parseInt(ddmmyyyyMatch[3], 10);
            scheduledDate = new Date(year, month, day);
          } else {
            const parsed = new Date(dateStr);
            scheduledDate = isNaN(parsed.getTime()) ? null : parsed;
          }
        }
      }

      if (scheduledDate) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfScheduledDay = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());

        if (startOfScheduledDay > startOfToday) {
          return {
            ...candidate,
            isActionsDisabled: true,
            disabledReason: `Interview is scheduled for ${scheduledDate.toLocaleDateString()}. Check-in will be enabled on that day.`,
            disabledButtonIndices: [0, 1, 2, 3],
          };
        }
      }
    }

    const hasReportedTime =
      candidate.reportingTime &&
      candidate.reportingTime !== '0001-01-01T00:00:00' &&
      !candidate.reportingTime.startsWith('0001-01-01');

    // A candidate is "Reported" if they have a non-zero reporting time OR their status is explicitly present/reported
    const isNotReported = !hasReportedTime && statusLower !== 'reported' && statusLower !== 'present';

    const hasNoOtherBatches = !this.batchList || this.batchList.length <= 1;
    let disabledButtonIndices: number[] = [];

    if (isNotReported) {
      // ABSENT / NOT REPORTED STATE:
      // - Mark as Present (0): Enabled
      // - Mark as Absent (1): Disabled (already absent)
      // - Assign to Batch (2): Enabled
      // - Upload ID Proof (3): Disabled (requires presence)
      disabledButtonIndices = [1, 3];
    } else {
      // PRESENT / REPORTED STATE:
      // - Mark as Present (0): Disabled (already present)
      // - Mark as Absent (1): Enabled (allows undo)
      // - Assign to Batch (2): Enabled
      // - Upload ID Proof (3): Enabled
      disabledButtonIndices = [0];
    }

    if (this.isAptitudeRound && hasNoOtherBatches) {
      disabledButtonIndices.push(2);
    }

    return {
      ...candidate,
      visibleButtonIndices: this.isAptitudeRound ? [0, 1, 2, 3] : [0, 1, 3],
      disabledButtonIndices,
    };
  }
}
