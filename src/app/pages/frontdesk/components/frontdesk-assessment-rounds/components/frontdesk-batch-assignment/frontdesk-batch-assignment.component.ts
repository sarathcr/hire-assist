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
        'pi pi-check-circle',
        'pi pi-times-circle',
        'pi pi-arrows-v',
        'pi pi-id-card',
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
  imports: [AccordionModule, TableComponent, CommonModule, ChipModule, Toast],
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
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Candidate ${candidate.name} ${event}`,
      });
      this.getAllPaginatedCandidates(new PaginatedPayload(), batchId);
    };

    const error = (error: CustomErrorResponse) => {
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
    this.assessmentService.getIdProofsByCandidateId(candidate.email).subscribe({
      next: (existingProof: FileDto[]) => {
        if (existingProof && existingProof.length > 0) {
          this.openUploadDialog(candidate, existingProof);
        } else {
          this.openUploadDialog(candidate);
        }
      },
      error: () => {
        console.log('Error fetching existing ID proofs');
      },
    });
  }
  private openUploadDialog(candidate: Candidate, files?: FileDto[]) {
    this.ref = this.dialog.open(UploadIdProofDialogComponent, {
      // data: filteredBatchList,
      data: {
        candidateEmail: candidate.email,
        existingFileUrl: files,
      },
      header: 'Upload ID Proof',
      width: '50vw',
      modal: true,
      styleClass: 'frontdeskIdproof__Dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe(
      (result: { idType: string; file: File } | undefined) => {
        if (result) {
          const payload: IdProofUploadRequest = {
            CandidateId: candidate.email,
            IdType: +result.idType,
            File: result.file,
            Description: '',
          };

          this.assessmentService.uploadIdProof(payload).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'ID Proof uploaded successfully',
              });
            },
            error: (error: CustomErrorResponse) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Upload Failed',
                detail: error?.error?.type || 'Something went wrong',
              });
            },
          });
        }
      },
    );
  }

  private getCurrentRouteIds() {
    this.route.paramMap.subscribe((params) => {
      this.assessmentRoundId = params.get('id')! as unknown as number;
      this.assessmentId = params.get('recruitmentId')! as unknown as number;
    });
  }

  private getAllBatches(): void {
    const next = (res: Batch[]) => {
      this.batchList = res;
    };

    const error = (error: CustomErrorResponse) => {
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
        data: res.data.map((candidate) => ({
          ...candidate,
          toggleTooltipIconIndex:
            candidate.reportingTime === '0001-01-01T00:00:00' ? 1 : 0,
        })),
      };
      this.candidatesByBatch[batchId] = updatedRes;
    };

    const error = (error: CustomErrorResponse) => {
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
    payload.filterMap = {
      ...payload.filterMap,
      assessmentId: this.assessmentId,
      assessmentRoundId: this.assessmentRoundId,
      batchId: batchId,
    };

    this.dataSourceService
      .getData(payload)
      .subscribe((response: PaginatedData<Candidate>) => {
        const updatedRes: PaginatedData<Candidate> = {
          ...response,
          data: response.data.map((candidate) => ({
            ...candidate,
            toggleTooltipIconIndex:
              candidate.reportingTime === '0001-01-01T00:00:00' ? 1 : 0,
          })),
        };
        this.candidatesByBatch[batchId] = updatedRes;
      });
  }
}
