/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileUpload, FileUploadHandlerEvent } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../../../shared/components/dialog/dialog.component';
import { TableDataSourceService } from '../../../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../../../shared/components/table/table.component';
import { ASSESSMENT_URL } from '../../../../../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../../../shared/models/dialog.models';
import { PaginatedPayload } from '../../../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedData,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../../../shared/models/table.models';
import {
  groupCandidatesByContact,
  parseCsvToJson,
} from '../../../../../../../../shared/utilities/csvParse.utility';
import { BatchSummaryModel } from '../../../../../../models/assessment-schedule.model';
import {
  CandidateApplicationQuestions,
  CandidateBatchCheckRequest,
  CandidateBatchCheckResponse,
  CandidateModel,
} from '../../../../../../models/candidate-data.model';
import { QuestionSetModel } from '../../../../../../models/question.model';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { CandidateService } from '../../../../services/candidate.service';
import { QuestionSetStateService } from '../../../../services/question-set-state.service';
import { AssessmentViewModel } from '../../assessment-view.component';
import { CandidateDialogComponent } from '../candidate-dialog/candidate-dialog.component';
import { CreateBatchDialogComponent } from '../create-batch-dialog/create-batch-dialog.component';
import { ManageDuplicateRecordsComponent } from '../manage-duplicate-records/manage-duplicate-records.component';

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
      field: 'batchName',
      displayName: 'Batch',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
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
@Component({
  selector: 'app-import-candidate-list-step',
  imports: [
    TableComponent,
    FileUpload,
    ButtonComponent,
    ToastModule,
    TooltipModule,
  ],
  templateUrl: './import-candidate-list-step.component.html',
  styleUrl: './import-candidate-list-step.component.scss',
  providers: [TableDataSourceService],
})
export class ImportCandidateListStepComponent implements OnInit {
  public url = `${ASSESSMENT_URL}/candidates/all`;
  public data!: PaginatedData<CandidateModel>;
  public columns: TableColumnsData = tableColumns;
  public fGroup!: FormGroup;
  public duplicateRecords: unknown[] = [];
  public assessmentId = input<number>();
  public selectedUsers: (string | undefined)[] = [];
  public importStatus = false;
  public newStatus = false;
  public isAllCandidatesAssigned = false;
  public unassignedCandidatesCount = 0;
  public UnassignedCandidate = '';

  private batches!: PaginatedData<BatchSummaryModel>;
  private questionSets!: QuestionSetModel[];
  private ref: DynamicDialogRef | undefined;
  private candidateApplicationQuestions!: CandidateApplicationQuestions[];

  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly messageService: MessageService,
    private readonly candidateService: CandidateService,
    private readonly dataSourceService: TableDataSourceService<CandidateModel>,
    public dialog: DialogService,
    private readonly router: Router,
    private readonly questionSetStateService: QuestionSetStateService,
  ) {}
  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getAllCandidates(new PaginatedPayload());
    this.getAllBatches(new PaginatedPayload());
    this.getAllQuestionSets(new PaginatedPayload());
    this.getAllCandidatesApplicationQuestions();
  }

  public deleteCandidate(userId: string) {
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the candidate?',
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
        // api call to delete the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the Candidate Successfully',
          });
          this.getAllCandidates(new PaginatedPayload());
        };
        const error = () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Deletion is failed',
          });
        };
        this.candidateService
          .deleteEntityById(userId, this.assessmentId())
          .subscribe({ next, error });
      }
    });
  }
  public getAllCandidates(payload: PaginatedPayload) {
    payload.filterMap = {
      assessmentId: Number(this.assessmentId()),
    };
    const next = (res: PaginatedData<CandidateModel>) => {
      this.data = res;
      if (this.data.data.length == 0) {
        this.importStatus = false;
        this.newStatus = true;
      } else {
        this.importStatus = true;
        this.newStatus = false;
      }
    };

    const error = (error: CustomErrorResponse) => {
      this.errorMessage(error);
    };
    this.candidateService
      .paginationEntity<CandidateModel>('all', payload)
      .subscribe({ next, error });
  }
  public getSelectedItems(selectedUsersIds: AssessmentViewModel[]): void {
    this.selectedUsers = selectedUsersIds.map(
      (item: AssessmentViewModel) => item.id,
    );
  }
  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.loadData(payload);
  }
  public onView(data: CandidateModel) {
    const userid = data.email;
    const assessmentId = this.assessmentId();
    this.router.navigate([
      `admin/recruitments/candidateDetail/${assessmentId}/${userid}`,
    ]);
  }
  public onImport(event: FileUploadHandlerEvent): void {
    const file = event.files[0];
    this.importCandidates(file);
    this.getAllCandidates(new PaginatedPayload());
  }
  public importCandidates(file: File) {
    this.assessmentService
      .uploadFileAndParseCsv(
        file,
        `candidates/import?asessmentId=${this.assessmentId()}`,
      )
      .subscribe({
        next: (csvString: string) => {
          const parsedData = parseCsvToJson(csvString);
          this.duplicateRecords = groupCandidatesByContact(parsedData);
          if (this.duplicateRecords.length > 0) {
            this.manageDuplicateRecords(this.duplicateRecords);
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Imported candidates successfully.`,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Import failed',
          });
        },
      });
  }
  public addNewCandidate() {
    this.ref = this.dialog.open(CandidateDialogComponent, {
      data: {
        batches: this.batches,
        questionSets: this.questionSets,
        applicationQuestions: this.candidateApplicationQuestions,
        candidateData: this.data,
      },
      header: 'Create Candidate',
      maximizable: false,
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.ref.onClose.subscribe((result) => {
      if (result) {
        result.assessmentId = this.assessmentId();
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Created the Candidate Successfully',
          });

          this.getAllCandidates(new PaginatedPayload());
          this.checkIsAllCandidatesAssigned();
        };
        const error = (error: CustomErrorResponse) => {
          const businerssErrorCode = error.error.businessError;
          if (businerssErrorCode === 4001) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Candidate Already Exists',
            });
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Creation failed',
          });
        };
        this.candidateService.createEntity(result).subscribe({ next, error });
      }
    });
  }
  public deleteSelectedCandidates() {
    const payload = {
      candidateIds: this.selectedUsers,
      assessmentId: this.assessmentId(),
    };
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the selected candidates?',
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
        // api call to delete the users
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the Selected Candidates Successfully',
          });
          this.getAllCandidates(new PaginatedPayload());
          this.checkIsAllCandidatesAssigned();
        };
        const error = () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Deletion failed',
          });
        };
        this.candidateService
          .updateEntity('', payload, 'remove')
          .subscribe({ next, error });
      }
    });
  }
  public scheduleAssessment(): void {
    if (this.selectedUsers) {
      const payload = {
        candidateIds: this.selectedUsers,
        assessmentId: this.assessmentId(),
      };
      const modalData: DialogData = {
        message: 'Are you sure you want to schedule the assessment?',
        isChoice: true,
        cancelButtonText: 'Cancel',
        acceptButtonText: 'Yes',
      };
      this.ref = this.dialog.open(DialogComponent, {
        data: modalData,
        header: 'Warning',
        maximizable: false,
        width: '50vw',
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
          this.assessmentService.createEntity(payload, 'schedule').subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Scheduled the Assessment Successfully',
              });
            },
            error: (error: CustomErrorResponse) => {
              const businessErrorCode = error.error?.businessError;
              if (businessErrorCode === 3111) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: error?.error?.type,
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Schedule failed',
                });
              }
            },
          });
        }
      });
    }
  }
  public createBatchSelectedCandidates() {
    this.ref = this.dialog.open(CreateBatchDialogComponent, {
      data: {
        batches: this.batches,
        questionSets: this.questionSets,
        candidateData: this.data,
      },
      header: 'Add Candidates to Batch',
      maximizable: false,
      width: '40vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.ref.onClose.subscribe((result) => {
      if (result) {
        const payload = {
          candidatesIds: this.selectedUsers,
          questionSetIds: result.questionSet,
          batchId: result.batch,
          StartDateTime: result.startDate,
          EndDateTime: result.endDate,
          AssessmentId: Number(this.assessmentId()),
        };

        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Added the Candidates Successfully',
          });

          this.getAllCandidates(new PaginatedPayload());
          this.checkIsAllCandidatesAssigned();
        };
        const error = (error: CustomErrorResponse) => {
          this.errorMessage(error);
        };
        this.candidateService
          .createEntity(payload, 'add-batch')
          .subscribe({ next, error });
      }
    });
  }
  private manageDuplicateRecords(duplicateRecords: unknown[]): void {
    this.ref = this.dialog.open(ManageDuplicateRecordsComponent, {
      data: {
        duplicateRecords,
        assessmentId: this.assessmentId(),
      },
      header: 'Duplicate Records',
      maximizable: true,
      width: '50vw',
      closable: false,
      modal: false,
      styleClass: 'manage-duplicate-records-dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.dialog.getInstance(this.ref)?.maximize();
    this.ref.onClose.subscribe((result) => {
      if (result?.refresh) {
        this.getAllCandidates(new PaginatedPayload());
      }
    });
  }
  private loadData(payload: PaginatedPayload): void {
    payload.filterMap = {
      ...payload.filterMap,
      assessmentId: Number(this.assessmentId()),
    };
    this.dataSourceService
      .getData(payload)
      .subscribe((response: PaginatedData<CandidateModel>) => {
        this.data = response;
      });
  }
  private getAllCandidatesApplicationQuestions() {
    const next = (res: CandidateApplicationQuestions[]) => {
      this.candidateApplicationQuestions = res;
    };

    const error = (error: CustomErrorResponse) => {
      this.errorMessage(error);
    };

    this.candidateService
      .getEntityById(Number(this.assessmentId()))
      .subscribe({ next, error });
  }
  private getAllBatches(payload: PaginatedPayload): void {
    payload.filterMap = {
      assessmentId: Number(this.assessmentId()),
    };

    const next = (res: any) => {
      this.batches = res.data;
    };

    const error = () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'error in getting batch details',
      });
    };

    this.assessmentService
      .paginationEntity('Batch/Batchsummary', payload)
      .subscribe({ next, error });
  }
  private getAllQuestionSets(payload: PaginatedPayload): void {
    payload.filterMap = {
      assessmentId: Number(this.assessmentId()),
    };

    const next = (res: any) => {
      this.questionSets = res.data;
      this.questionSetStateService.setQuestionSets(this.questionSets);
    };

    const error = (error: CustomErrorResponse) => {
      this.errorMessage(error);
    };

    this.assessmentService
      .paginationEntity('QuestionSetSummary', payload)
      .subscribe({ next, error });
  }
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${this.url}`);
  }

  private checkIsAllCandidatesAssigned(): void {
    const payload: CandidateBatchCheckRequest = {
      assessmentId: this.assessmentId()?.toString() || '',
      candidateIds: this.selectedUsers as string[],
    };
    this.assessmentService
      .checkAllCandidatesAssignedToBatches(payload)
      .subscribe({
        next: (res: CandidateBatchCheckResponse) => {
          this.isAllCandidatesAssigned = res.isAllCandidatesAssigned;
          this.unassignedCandidatesCount = res.unassignedCandidatesCount;
          this.UnassignedCandidate = res.UnassignedCandidate;
        },
        error: (error: CustomErrorResponse) => {
          this.errorMessage(error);
        },
      });
  }

  private errorMessage(error: CustomErrorResponse): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error?.error?.type || 'Contact Technical Support',
    });
  }
}
