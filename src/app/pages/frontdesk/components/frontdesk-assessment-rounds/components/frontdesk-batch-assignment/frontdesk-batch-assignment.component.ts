import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AccordionModule, AccordionTabOpenEvent } from 'primeng/accordion';
import { MenuItem, MessageService } from 'primeng/api';
import { ChipModule } from 'primeng/chip';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Toast } from 'primeng/toast';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { ASSESSMENT_URL } from '../../../../../../shared/constants/api';
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
import {
  FileDto,
  IdProofUploadRequest,
} from '../../../../../admin/models/assessment.model';
import { MarkAsPresentRequest } from '../../../../../admin/models/question.model';
import { AssessmentService } from '../../../../../admin/services/assessment.service';
import { AssignBatchDialogComponent } from '../assign-batch-dialog/assign-batch-dialog.component';
import { UploadIdProofDialogComponent } from '../upload-id-proof-dialog/upload-id-proof-dialog.component';
import { FrontdeskBatchAssignmentSkeletonComponent } from './frontdesk-batch-assignment-skeleton.component';
import { TableSkeletonComponent } from '../../../../../../shared/components/table/table.skeleton';
import { StatusEnum } from '../../../../../../shared/enums/status.enum';
import { finalize } from 'rxjs/operators';
const tableColumns: TableColumnsData = {
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
      field: 'reportingTime',
      displayName: 'Reporting Time',
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
    },
    {
      field: 'button',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      buttonTooltips: [
        'Mark as Present',
        'Unmark Presence',
        'Assign to another batch',
        'Upload Id Proof',
      ],
      buttonIcons: [
        'pi pi-check', // Mark as Present - check icon
        'pi pi-times', // Unmark Presence - close/cross icon
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
}

export interface ButtonAction {
  fName: string;
  event: Candidate;
}

export interface Batch {
  id: string;
  name: string;
  scheduledTime: string;
}

export interface AssignToAnotherBatchDialogData {
  batch: string;
}

@Component({
  selector: 'app-frontdesk-batch-assignment',
  imports: [AccordionModule, TableComponent, CommonModule, ChipModule, Toast, FrontdeskBatchAssignmentSkeletonComponent, TableSkeletonComponent],
  templateUrl: './frontdesk-batch-assignment.component.html',
  styleUrl: './frontdesk-batch-assignment.component.scss',
  providers: [TableDataSourceService],
})
export class FrontdeskBatchAssignmentComponent implements OnInit {
  public sidebarConfig!: MenuItem[];
  public selectedView: 0 | 1 = 0;
  public columns: TableColumnsData = tableColumns;
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

  public filterMap!: FilterMap;

  constructor(
    public dialog: DialogService,
    public messageService: MessageService,
    private route: ActivatedRoute,
    private assessmentService: AssessmentService,
    private dataSourceService: TableDataSourceService<Candidate>,
  ) {}

  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getCurrentRouteIds();
    this.getAllBatches();
  }

  public onButtonClick($event: ButtonAction, batchId: string) {
    if (
      $event.fName === 'Mark as Present' ||
      $event.fName === 'Unmark Presence'
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

  public loadCandidatesForBatch(batchId: string): void {
    if (!this.candidatesByBatch[batchId]) {
      this.loadingBatches[batchId] = true;
      const payload = new PaginatedPayload();
      this.getAllPaginatedCandidates(payload, batchId);
    }
  }

  public onAccordionOpen(event: AccordionTabOpenEvent): void {
    const batch = this.batchList.find((b) => b.name === String(event.index));
    if (batch) {
      this.loadCandidatesForBatch(batch.id);
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
      this.getAllPaginatedCandidates(new PaginatedPayload(), batchId);
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
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: 'batch not selected',
        });
      }

      const targetBatchId = (result as AssignToAnotherBatchDialogData).batch;

      const next = () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Candidate ${candidate.name} marked as present`,
        });
        this.getAllPaginatedCandidates(new PaginatedPayload(), batchId);
        this.getAllPaginatedCandidates(new PaginatedPayload(), targetBatchId);
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
        this.getAllPaginatedCandidates(new PaginatedPayload(), batchId);
      }
    });
  }

  private getCurrentRouteIds() {
    this.route.paramMap.subscribe((params) => {
      this.assessmentRoundId = params.get('id')! as unknown as number;
      this.assessmentId = params.get('recruitmentId')! as unknown as number;
    });
  }

  private getAllBatches(): void {
    this.isLoading = true;
    const next = (res: Batch[]) => {
      this.batchList = res;
      this.isLoading = false;
    };

    const error = (error: CustomErrorResponse) => {
      this.isLoading = false;
      const businerssErrorCode = error.error.businessError;
      if (businerssErrorCode === 3109) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error.type,
        });
      }
    };

    this.assessmentService
      .getBatchesForFrontDesk(this.assessmentId)
      .subscribe({ next, error });
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
        data: res.data.map((candidate) => {
          // Candidate is present if statusId is Active (1) or status is 'Active'
          const isPresent = candidate.statusId === StatusEnum.Active || candidate.status?.toLowerCase() === 'active';
          return {
            ...candidate,
            // Default to absent: show only "Mark as Present" (index 0) - check icon
            // When present (Active): show "Unmark Presence" (index 1) - close icon, "Assign to another batch" (index 2), and "Upload Id Proof" (index 3)
            toggleTooltipIconIndex: isPresent ? 0 : 1,
            visibleButtonIndices: isPresent ? [1, 2, 3] : [0],
          };
        }),
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
            data: response.data.map((candidate) => {
              // Candidate is present if statusId is Active (1) or status is 'Active'
              const isPresent = candidate.statusId === StatusEnum.Active || candidate.status?.toLowerCase() === 'active';
              return {
                ...candidate,
                // Default to absent: show only "Mark as Present" (index 0) - check icon
                // When present (Active): show "Unmark Presence" (index 1) - close icon, "Assign to another batch" (index 2), and "Upload Id Proof" (index 3)
                toggleTooltipIconIndex: isPresent ? 0 : 1,
                visibleButtonIndices: isPresent ? [1, 2, 3] : [0],
              };
            }),
          };
          this.candidatesByBatch[batchId] = updatedRes;
        },
      });
  }
}
