/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Toast } from 'primeng/toast';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../../../shared/components/dialog/dialog.component';
import { TableDataSourceService } from '../../../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../../../shared/components/table/table.component';
import { INTERVIEW_URL } from '../../../../../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../../../shared/models/dialog.models';
import { PaginatedPayload } from '../../../../../../../../shared/models/pagination.models';
import { recruitment } from '../../../../../../../../shared/models/stepper.models';
import {
  FilterMap
} from '../../../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../../../shared/models/table.models';
import { StepperData } from '../../../../../../models/stepper.model';
import { InterviewService } from '../../../../services/interview.service';
import { StepperService } from '../../../../services/stepper.service';
import { ScheduleInterviewComponent } from '../schedule-interview/schedule-interview.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';


const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Name',
      sortedColumn: true,
      hasChip: false,
      hasFilter: false,
    },
    {
      field: 'email',
      displayName: 'Email',
      sortedColumn: true,
      hasChip: false,
      hasFilter: false,
    },
    {
      field: 'score',
      displayName: 'Score',
      sortedColumn: true,
      hasChip: false,
      hasFilter: true,
    },
    {
      field: 'status',
      displayName: 'Status',
      sortedColumn: true,
      hasChip: false,
      hasFilter: false,
    },
     {
      field: 'isScheduled',
      displayName: 'IsScheduled',
      sortedColumn: true,
      hasChip: false,
      hasFilter: false,
    },

    {
      field: 'actions',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      actions: [PaginatedDataActions.Edit, PaginatedDataActions.Delete],
      sortedColumn: false,
      hasChip: false,
      hasFilter: false,
    },
  ],
  displayedColumns: ['registeredName', 'actions'],
};

type payload = Record<string, any>;

@Component({
  selector: 'app-stepper-view',
  imports: [TableComponent, Toast, ButtonComponent],
  providers: [TableDataSourceService],
  templateUrl: './stepper-view.component.html',
  styleUrl: './stepper-view.component.scss',
})
export class StepperViewComponent extends BaseComponent implements OnInit {
  public assessmentId!: number;
  public nextRoundId!: recruitment;
  public activeStepData!: StepperData;
  public columns: TableColumnsData = tableColumns;
  public filterMap!: FilterMap;

  public data: any;
  public selectedCandidatesIds!: string[];

  private ref: DynamicDialogRef | undefined;
  public assessmentRound!:
    | { id: number; header: string; value: number; component?: any }
    | undefined;
  public assessmentRoundList!: recruitment[] | null;
  public currentRound!: any;
  public round!: number | null;
  public status!: number | null;

  constructor(
    private stepperService: StepperService,
    private interviewService: InterviewService,
    public dialog: DialogService,
    public interviewservice: InterviewService,
    public messageService: MessageService,
    private dataSourceService: TableDataSourceService<any>,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    super();
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    // this.subscribeToStepChange();
    this.setPaginationEndpoint();
    const routeId = this.activatedRoute.snapshot.paramMap.get('id');
    if (routeId) {
      this.assessmentId = Number(routeId);
    }
    console.log('StepperViewComponent initialized!');
    const current = this.stepperService.getCurrentStep();
    console.log('Current Step', current);
    if (current) {
      this.activeStepData = current;

    }
    const Pushstatus = this.stepperService.statusType$.subscribe((value) => {
      this.status = value;
      console.log('status in StepperViewComponent:', this.status);

      const payload: payload = {};

      if (this.status) {
        const dynamicKey = 'status';

        if (this.status === 1) {
          payload[dynamicKey] = 8;
        } else if (this.status === 2) {
          payload[dynamicKey] = 9;
        } else {
          payload[dynamicKey] = 2;
        }
      }

      const combinedPayloadData = {
        ...payload,
        assessmentId: this.assessmentId ?? '',
      };

      this.getPaginatedCandidateData(combinedPayloadData);
    });
    this.subscriptionList.push(Pushstatus);

    this.subscriptionList.push(Pushstatus);

    const AssessmentRoundList =
      this.stepperService.AssessmentRoundList$.subscribe((value) => {
        this.assessmentRoundList = value;
        console.log('Assessment Round List:', this.assessmentRoundList);
      });
    this.subscriptionList.push(AssessmentRoundList);

    const Pushround = this.stepperService.CurrentRound$.subscribe((value) => {
      this.round = value;

      const payload: payload = {
        AssessmentRoundId: this.round,
      };
      this.filterMap = payload;
      this.getPaginatedCandidateData(payload);
    });
    this.subscriptionList.push(Pushround);
  }

  public deleteCandidate(id: string) {
    this.openDeleteCandidateConfirmationModal(id);
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    if (this.filterMap) {
      payload.filterMap = {
        ...this.filterMap,
        ...payload.filterMap,
      };
    }

    console.log('Final FilterMap:', payload.filterMap);

    this.loadData(payload);
  }

  public getSelectedId(selectedIds: string[]) {
    this.selectedCandidatesIds = selectedIds;
    if (this.selectedCandidatesIds.length) {
      this.openScheduleCandidateModal(this.selectedCandidatesIds);
    }
  }

  public handleCompleteAssessmentRound() {
    this.stepperService.advanceStep();
  }

  // Private Methods
  private subscribeToStepChange(): void {
    const sub = this.stepperService.currentStep$.subscribe((data) => {
      if (data !== null) {
        this.activeStepData = data;
        this.getPaginatedCandidateData(this.activeStepData);
      }
    });

    this.subscriptionList.push(sub);
  }

  private getPaginatedCandidateData(data: payload) {
    const payload = {
      multiSortedColumns: [],
      filterMap: data || {},
      pagination: {
        pageNumber: 1,
        pageSize: 5,
      },
    };

    this.interviewService
      .paginationEntity('InterviewSummary', payload)
      .subscribe({
        next: (res : any) => {
          const resData = res.data.map((item: any) => {
            return {
              ...item,
              isScheduled: item.isScheduled ? 'Scheduled' : '',
            };
          });

         this.data = {...res, data: resData};
          console.log('Paginated Data:', this.data);
          
          // this.data = res;
          // this.data.data = this.data.data.map((item: any) => {
          //   return {
          //     ...item,
          //     isScheduled: item.isScheduled ? 'Scheduled' : '',
          //   };
          // });
        },
        error: (error: CustomErrorResponse) => {
        },
      });
  }

  private openDeleteCandidateConfirmationModal(id: string) {
    const modalData: DialogData = {
      message: 'Are you sure you want to to delete the user?',
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
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the User Successfully',
          });
          this.getPaginatedCandidateData(this.activeStepData);
        };
        const error = (error: string) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Deletion is failed',
          });
          console.log('ERROR', error);
        };
        this.interviewservice.DeleteCandidate(id).subscribe({ next, error });
      }
    });
  }

  private openScheduleCandidateModal(selectedCandidates: string[]) {
    this.ref = this.dialog.open(ScheduleInterviewComponent, {
      data: selectedCandidates,
      header: 'Schedule Interview',
      height: '30vh',
      width: '30vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((result) => {
      if (result) {
        if (this.assessmentRoundList) {
          const currentIndex = this.assessmentRoundList.findIndex(
            (round) => round.id === this.round,
          );

          if (
            currentIndex !== -1 &&
            currentIndex < this.assessmentRoundList.length - 1
          ) {
            this.nextRoundId = this.assessmentRoundList[currentIndex + 1];
          }
        }
        result.scheduleDate = new Date(result.scheduleDate).toISOString();
        let payload = [];
        payload = selectedCandidates.map((item: string) => {
          const payloadData = {
            candidateId: item,
            assessmentRoundId: this.nextRoundId.id,
            isActive: true,
            statusId: 2,
            assessmentId: this.nextRoundId.assessmentid,
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
          this.getPaginatedCandidateData(this.activeStepData);
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

        this.interviewservice.createEntity(payload).subscribe({ next, error });
      }
    });
  }

  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService.getData(payload).subscribe((response:any) => {
      const resData = response.data.map((item: any) => {
            return {
              ...item,
              isScheduled: item.isScheduled ? 'Scheduled' : '',
            };
          });

         this.data = {...response, data: resData};
    });
  }

  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${INTERVIEW_URL}/InterviewSummary`);
  }

  public onView(data: any) {
    const userid = data.email;

    const assessmentId = this.assessmentRoundList?.[0].assessmentid;
    const route = this.router.navigate(['/profile', userid, assessmentId]);
    console.log('User ID:', route);
  }
}
