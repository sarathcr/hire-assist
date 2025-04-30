/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Toast } from 'primeng/toast';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { PaginatedPayload } from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { StoreService } from '../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../shared/utilities/form.utility';
import { AssessmentScheduleModal } from '../../../../models/assessment-schedule.model';
import { AssessmentService } from '../../../../services/assessment.service';
import { UserService } from '../../../../services/user.service';
import { assessmentScheduleService } from '../../services/assessment-schedule.service';
import { AssessmentScheduleModalComponent } from './components/assessment-schedule-modal/assessment-schedule-modal.component';
import { CandidateDialogComponent } from './components/candidate-dialog/candidate-dialog.component';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { CandidateService } from '../../services/candidate.service';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { CreateBatchDialogComponent } from './components/create-batch-dialog/create-batch-dialog.component';

const tableColumns: TableColumnsData = {
  columns: [
    { field: 'name', displayName: 'Name', sortedColumn: true, hasChip: false },
    {
      field: 'email',
      displayName: 'Email',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'batchName',
      displayName: 'Batch',
      sortedColumn: true,
      hasChip: false,
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
  displayedColumns: ['registeredName', 'actions'],
};

@Component({
  selector: 'app-assessment-view',
  imports: [ButtonComponent, TableComponent, Toast, DragDropModule],
  providers: [TableDataSourceService],
  templateUrl: './assessment-view.component.html',
  styleUrl: './assessment-view.component.scss',
})
export class AssessmentViewComponent implements OnInit {
  public url = 'AssessmentRound';
  public data!: any;
  public columns: TableColumnsData = tableColumns;
  public fGroup!: FormGroup;
  public assessmentSchedule = new AssessmentScheduleModal();
  public configMap!: ConfigMap;
  public submittedData!: any;

  private ref: DynamicDialogRef | undefined;
  private batches!: any;
  private assessmentId!: number;
  private questionSets!: any;

  constructor(
    private storeService: StoreService,
    private assessmentService: AssessmentService,
    private userService: UserService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: DialogService,
    private assessmentScheduleService: assessmentScheduleService,
    private dataSourceService: TableDataSourceService<any>,
    private candidateService: CandidateService,
  ) {
    this.fGroup = buildFormGroup(this.assessmentSchedule);
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getCurrentRouteId();
    this.getAllCandidates(new PaginatedPayload());
    this.getAllBatches(new PaginatedPayload());
  }

  // Public Methods
  public onDrop(event: CdkDragDrop<any[]>) {
    moveItemInArray(
      this.submittedData,
      event.previousIndex,
      event.currentIndex,
    );
  }

  public onNavigateclick(): void {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
    };
    this.ref = this.dialog.open(AssessmentScheduleModalComponent, {
      data: data,
      header: 'Select Rounds',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((formData: any) => {
      if (formData?.round?.length) {
        const collections: any = this.storeService.getCollection();
        this.submittedData = collections['rounds']
          .filter((item: any) =>
            formData.round.includes(item.value, item.label),
          )
          .map((item: any) => ({
            id: item.value,
            name: item.label,
          }));

        console.log('submittedData', this.submittedData);
      } else {
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: 'Rounds are not selected',
        });
        console.log('Error in selecting rounds');
      }
    });
  }

  public onAdd(): void {
    const payload = this.submittedData.map((item: any, index: number) => ({
      RoundId: item.id,
      name: item.name,
      sequence: index + 1,
    }));

    this.assessmentScheduleService
      .CreateAssessmentRound(payload, this.assessmentId)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Rounds ordered successfully!',
          });
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save round order.',
          });
          console.error(error);
        },
      });
  }

  public importCandidates(file: File) {
    const next = (val: any) => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Imported the ${val.total} candidates Successfully`,
      });

      if (val.existingCandidates) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: `There were ${val.existingCandidates} existing candidates`,
        });
      }
      this.getAllCandidates(new PaginatedPayload());
    };
    const error = (error: string) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Import failed',
      });
      console.log('ERROR', error);
    };
    this.assessmentService
      .uploadFile(file, `import-candidates?asessmentId=${this.assessmentId}`)
      .subscribe({ next, error });
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.loadData(payload);
  }

  public addNewCandidate() {
    this.ref = this.dialog.open(CandidateDialogComponent, {
      data: { batches: this.batches, questionSets: this.questionSets },
      header: 'Create Candidate',
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
        result.assessmentId = this.assessmentId;
        // api call to create the Candidate
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Created the Candidate Successfully',
          });

          this.getAllCandidates(new PaginatedPayload());
          console.log('successfully created the Candidate', this.data);
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
          console.log('ERROR', error);
        };
        this.candidateService.createEntity(result).subscribe({ next, error });
      }
    });
  }

  public deleteCandidate(userId: string) {
    const modalData: DialogData = {
      message: 'Are you sure you want to to delete the candidate?',
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
        const error = (error: string) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Deletion is failed',
          });
          console.log('ERROR', error);
        };
        this.candidateService
          .deleteEntityById(userId, this.assessmentId)
          .subscribe({ next, error });
      }
    });
  }

  public deleteSelectedCandidates(selectedUsersIds: string[]) {
    const payload = {
      candidateIds: selectedUsersIds,
      assessmentId: this.assessmentId,
    };
    const modalData: DialogData = {
      message: 'Are you sure you want to to delete the selected candidates?',
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
        };
        const error = (error: string) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Deletion is failed',
          });
          console.log('ERROR', error);
        };
        this.candidateService
          .updateEntity('', payload, 'remove')
          .subscribe({ next, error });
      }
    });
  }

  public createBatchSelectedCandidates(selectedUsersIds: string[]) {
    this.ref = this.dialog.open(CreateBatchDialogComponent, {
      data: { batches: this.batches, questionSets: this.questionSets },
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
        console.log(result);
        const payload = {
          candidatesIds: selectedUsersIds,
          questionSetIds: result.questionSet,
          batchId: result.batch,
        };
        // api call to create the Candidate
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Added the Candidates Successfully',
          });

          this.getAllCandidates(new PaginatedPayload());
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
          console.log('ERROR', error);
        };
        this.candidateService
          .createEntity(payload, 'add-batch')
          .subscribe({ next, error });
      }
    });
  }

  public scheduleAssessment(value: boolean): void {
    if (value) {
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
          // api call to schedule the assessment
          const next = () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Scheduled the Assessment Successfully',
            });
          };
          const error = (error: CustomErrorResponse) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Schedule failed',
            });
            console.log('ERROR', error);
          };
          this.assessmentService
            .createEntity({ assessmentId: this.assessmentId }, 'schedule')
            .subscribe({ next, error });
        }
      });
    }
  }

  // Private Methods
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${this.url}`);
  }

  private getCurrentRouteId() {
    this.route.paramMap.subscribe((params) => {
      this.assessmentId = params.get('id')! as unknown as number;
    });
  }

  private getAllCandidates(payload: PaginatedPayload) {
    payload.filterMap = {
      assessmentId: this.assessmentId,
      roles: ['5'],
    };
    const next = (res: any) => {
      this.data = res;
    };
    const error = (error: string) => {
      console.log('ERROR', error);
    };
    this.userService
      .paginationEntity('all', payload)
      .subscribe({ next, error });
  }

  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService.getData(payload).subscribe((response: any) => {
      this.data = response;
    });
  }

  private getAllBatches(payload: PaginatedPayload): void {
    payload.filterMap = {
      assessmentId: this.assessmentId,
    };

    const next = (res: any) => {
      console.log(res.data);
      this.batches = res.data;
    };

    const error = (err: any) => {
      console.error('ERROR', err);
    };

    this.assessmentService
      .paginationEntity('Batch/Batchsummary', payload)
      .subscribe({ next, error });
  }
}
