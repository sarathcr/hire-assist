/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, input, OnInit, ViewChild } from '@angular/core';
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
import { Option } from '../../../../../../../../shared/models/app-state.models';
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
import { StoreService } from '../../../../../../../../shared/services/store.service';
import { StepsStatusService } from '../../../../services/steps-status.service';
import { finalize } from 'rxjs/operators';

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
  @ViewChild(TableComponent) tableComponent!: TableComponent<any>;

  public url = `${ASSESSMENT_URL}/candidates/all`;
  public data!: PaginatedData<CandidateModel>;
  public columns: TableColumnsData = tableColumns;
  public fGroup!: FormGroup;
  public duplicateRecords: unknown[] = [];
  public isUploading = false;
  public assessmentId = input<number>();
  public selectedUsers: (string | undefined)[] = [];
  public selectedCandidates: CandidateModel[] = [];
  public disableScheduleButton = true;
  public importStatus = false;
  public newStatus = false;
  public isAllCandidatesAssigned = false;
  public unassignedCandidatesCount = 0;
  public UnassignedCandidate = '';
  public isLoading = false;
  public alreadySelectedCandidates: string[] = [];
  private skipAutoSelection = false;

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
    private readonly storeService: StoreService,
    private readonly stepsStatusService: StepsStatusService,
  ) {}
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getAllCandidates(new PaginatedPayload());
    this.getBatchesFromStore();
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
        this.isLoading = true;
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the Candidate Successfully',
          });
          this.getAllCandidates(new PaginatedPayload(), true);
        };
        const error = () => {
          this.isLoading = false;
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
  public getAllCandidates(payload: PaginatedPayload, clearLoading = false) {
    this.isLoading = true;
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
      if (!this.skipAutoSelection) {
        this.updateAlreadySelectedCandidates();
      }
      this.skipAutoSelection = false;
      if (clearLoading) {
        this.isLoading = false;
      } else {
        this.isLoading = false;
      }
    };

    const error = (error: CustomErrorResponse) => {
      this.isLoading = false;
      this.errorMessage(error);
    };
    this.candidateService
      .paginationEntity<CandidateModel>('all', payload)
      .subscribe({ next, error });
  }
  public getSelectedItems(selectedUsersIds: AssessmentViewModel[]): void {
    this.selectedUsers = selectedUsersIds.map((item) => item.id);
    this.updateScheduleButtonState();
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
    this.isLoading = true;
    this.isUploading = true;
    this.importCandidates(file);
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
          } else {
            this.getAllCandidates(new PaginatedPayload(), true);
          }
          // Refresh application questions after CSV import to get newly added columns
          this.getAllCandidatesApplicationQuestions();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Imported candidates successfully.`,
          });
          this.isUploading = false;
        },
        error: (err) => {
          let errorMessage = 'Something went wrong';

          // Handle 3106 error (Duplicate Data)
          if (err.status === 422 && err.error?.businessError === 3106) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const text = e.target?.result as string;
              const parsedData = parseCsvToJson(text);
              const duplicateRecords = groupCandidatesByContact(parsedData);
              if (duplicateRecords.length > 0) {
                this.manageDuplicateRecords(duplicateRecords);
              }
              this.isLoading = false;
              this.isUploading = false;
            };
            reader.readAsText(file);
            return;
          }

          if (typeof err.error === 'string') {
            try {
              const parsed = JSON.parse(err.error);
              errorMessage = parsed.type || parsed.detail;
            } catch {
              errorMessage = err.error;
            }
          } else {
            errorMessage = err?.error?.type || err?.error?.detail;
          }

          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error : ${errorMessage}`,
          });
          this.isUploading = false;
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
      focusOnShow: false,
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
        this.isLoading = true;
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the Selected Candidates Successfully',
          });
          this.tableComponent?.clearAllSelections();
          this.getAllCandidates(new PaginatedPayload(), true);
          this.checkIsAllCandidatesAssigned();
        };
        const error = () => {
          this.isLoading = false;
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
          this.isLoading = true;
          this.assessmentService.createEntity(payload, 'schedule').subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Scheduled the Assessment Successfully',
              });
              const scheduledCandidateIds = [...this.selectedUsers] as string[];
              this.skipAutoSelection = true;
              this.alreadySelectedCandidates = scheduledCandidateIds.filter(
                (id): id is string => id !== undefined,
              );
              this.getAllCandidates(new PaginatedPayload(), true);
              this.checkStepStatusAndMoveNext();
            },
            error: (error: CustomErrorResponse) => {
              this.isLoading = false;
              if (error?.error?.type) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: error?.error?.type,
                  life: 30000,
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
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.ref.onClose.subscribe((result) => {
      if (result) {
        // Check which candidates are already assigned to a batch
        const alreadyAssignedCandidates = this.data.data.filter(
          (candidate) =>
            this.selectedUsers.includes(candidate.id) &&
            candidate.batchId > 0,
        );

        if (alreadyAssignedCandidates.length > 0) {
          // Show warning modal with list of already assigned candidates
          const candidateNames = alreadyAssignedCandidates.map((c) => c.name);
          const modalData: DialogData = {
            message: `The following candidate(s) are already assigned to a batch. By clicking Submit, the existing batch assignment will be replaced with the currently selected batch.`,
            candidateNames: candidateNames,
            isChoice: true,
            cancelButtonText: 'Cancel',
            acceptButtonText: 'Submit',
          };

          const warningRef = this.dialog.open(DialogComponent, {
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

          warningRef.onClose.subscribe((proceed) => {
            if (proceed === true) {
              // User clicked Submit, proceed with batch assignment
              this.submitBatchAssignment(result);
            }
            // If user clicked Cancel or closed dialog, do nothing
          });
        } else {
          // No candidates are already assigned, proceed directly
          this.submitBatchAssignment(result);
        }
      }
    });
  }

  private submitBatchAssignment(result: any): void {
    this.isLoading = true;
    const payload = {
      candidatesIds: this.selectedUsers,
      questionSetIds: Array.isArray(result.questionSet)
        ? result.questionSet
        : [result.questionSet],
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
      this.isLoading = false;
      this.errorMessage(error);
    };
    this.candidateService
      .createEntity(payload, 'add-batch')
      .subscribe({ next, error });
  }

  private manageDuplicateRecords(duplicateRecords: unknown[]): void {
    this.ref = this.dialog.open(ManageDuplicateRecordsComponent, {
      data: {
        duplicateRecords,
        assessmentId: this.assessmentId(),
        applicationQuestions: this.candidateApplicationQuestions,
      },
      header: 'Duplicate Records',
      maximizable: true,
      width: '50vw',
      closable: false,
      modal: false,
      focusOnShow: false,
      styleClass: 'manage-duplicate-records-dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.dialog.getInstance(this.ref)?.maximize();
    this.ref.onClose.subscribe((result) => {
      if (result?.refresh) {
        this.getAllCandidates(new PaginatedPayload(), true);
        // Refresh application questions after resolving duplicates to get newly added columns
        this.getAllCandidatesApplicationQuestions();
      } else {
        this.isLoading = false;
      }
    });
  }
  private loadData(payload: PaginatedPayload): void {
    this.isLoading = true;
    payload.filterMap = {
      ...payload.filterMap,
      assessmentId: Number(this.assessmentId()),
    };
    this.dataSourceService
      .getData(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((response: PaginatedData<CandidateModel>) => {
        this.data = response;
        this.alreadySelectedCandidates = [...(this.selectedUsers as string[])];
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
  private getBatchesFromStore(): void {
    const collection = this.storeService.getCollection();
    const batchesFromStore = collection?.['batches'] || [];

    const batchData = batchesFromStore
      .filter((batch: Option) => batch.value && batch.label)
      .map((batch: Option) => ({
        id: Number(batch.value),
        title: batch.label || '',
        description: '',
        assessmentId: Number(this.assessmentId()),
        assessmentName: null,
        isActive: true,
        startDate: '',
        endDate: '',
        active: '',
        descriptionNew: '',
      }));

    this.batches = {
      pageNumber: 1,
      pageSize: batchData.length,
      totalPages: 1,
      totalRecords: batchData.length,
      data: batchData,
      sum: '',
      succeeded: true,
      errors: [],
      message: '',
    };
  }
  private getAllQuestionSets(payload: PaginatedPayload): void {
    payload.filterMap = {
      assessmentId: Number(this.assessmentId()),
    };
    payload.pagination.pageSize = -1;

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

  // private updateAlreadySelectedCandidates(): void {
  //   if (!this.data || !this.data.data) {
  //     this.alreadySelectedCandidates = [];
  //     return;
  //   }

  //   this.alreadySelectedCandidates = this.data.data
  //     .filter(
  //       (candidate: CandidateModel) =>
  //         candidate.batchId !== null &&
  //         candidate.batchId !== undefined &&
  //         candidate.batchId > 0,
  //     )
  //     .map((candidate: CandidateModel) => candidate.id);
  // }
  private updateAlreadySelectedCandidates(): void {
    this.alreadySelectedCandidates = [];
    this.selectedUsers = [];
  }

  private checkStepStatusAndMoveNext(): void {
    const assessmentId = Number(this.assessmentId());
    if (assessmentId) {
      this.stepsStatusService.getAssessmentStepsStatus(assessmentId).subscribe({
        next: () => {
          this.stepsStatusService.notifyStepCompleted(assessmentId);
        },
        error: () => {
          this.stepsStatusService.notifyStepCompleted(assessmentId);
        },
      });
    }
  }

  private updateScheduleButtonState(): void {
    if (!this.selectedUsers?.length || !this.data?.data) {
      this.disableScheduleButton = true;
      return;
    }

    const hasUnassignedCandidate = this.data.data.some(
      (candidate: CandidateModel) =>
        this.selectedUsers.includes(candidate.id) && candidate.batchId === 0,
    );

    this.disableScheduleButton = hasUnassignedCandidate;
  }
}
