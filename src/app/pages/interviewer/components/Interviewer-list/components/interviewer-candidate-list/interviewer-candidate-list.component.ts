import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { INTERVIEW_URL } from '../../../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import {
  FilterMap,
  PaginatedData,
  PaginatedPayload,
} from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { InterviewByPanel } from '../../../../../admin/models/assessment-schedule.model';
import { InterviewService } from '../../../../../admin/services/interview.service';
import { InterviewerCandidateListSkeletonComponent } from './interviewer-candidate-list.skeleton';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Candidate Name',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'roundName',
      displayName: 'Assessment Round',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'interviewDate',
      displayName: 'Interview Schedule',
      sortedColumn: true,
      hasChip: false,
      fieldType: FieldType.StringToDateTime,
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
      field: 'actions',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      actions: [PaginatedDataActions.StartInterview],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: [],
};

// Type for table data with string id (required by TableComponent)
type TableDataItem = InterviewByPanel & { id: string };

@Component({
  selector: 'app-interviewer-candidate-list',
  imports: [
    TableComponent,
    InterviewerCandidateListSkeletonComponent,
    CardModule,
    BadgeModule,
    AsyncPipe,
  ],
  providers: [TableDataSourceService],
  templateUrl: './interviewer-candidate-list.component.html',
  styleUrl: './interviewer-candidate-list.component.scss',
})
export class InterviewerCandidateListComponent implements OnInit {
  public data!: PaginatedData<InterviewByPanel>;
  public columns: TableColumnsData = tableColumns;
  public isInitialLoad = true;

  private assessmentId!: number;
  private panelId!: number;
  public filterMap!: FilterMap;
  public todayInterviews: InterviewByPanel[] = [];
  public previousInterviews: InterviewByPanel[] = [];
  public upcomingInterviews: InterviewByPanel[] = [];
  public tableData: PaginatedData<TableDataItem> = {
    pageNumber: 1,
    pageSize: 5,
    totalPages: 0,
    totalRecords: 0,
    data: [],
    succeeded: true,
    errors: [],
    message: '',
  };

  // Computed counts for summary cards
  get todayCount(): number {
    return this.todayInterviews?.length || 0;
  }

  get upcomingCount(): number {
    return this.upcomingInterviews?.length || 0;
  }

  get previousCount(): number {
    return this.previousInterviews?.length || 0;
  }

  get totalCount(): number {
    return this.todayCount + this.upcomingCount + this.previousCount;
  }

  get summaryCounts() {
    return {
      today: this.todayCount,
      upcoming: this.upcomingCount,
      previous: this.previousCount,
      total: this.totalCount,
    };
  }

  get loading$() {
    return this.dataSourceService.loading$;
  }

  constructor(
    private readonly interviewService: InterviewService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly messageService: MessageService,
    private readonly dataSourceService: TableDataSourceService<InterviewByPanel>,
  ) {}

  // Lifecycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getCurrentRouteId();
    this.getPaginatedCandidateData(new PaginatedPayload());
  }

  // Public Methods
  public onButtonClick(data: InterviewByPanel): void {
    const basePath = this.router.url.includes('/admin/')
      ? 'admin/interviews'
      : 'interviewer';
    this.router.navigate([`${basePath}/${this.assessmentId}/${data.email}`]);
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.filterMap = {
      ...this.filterMap,
      PanelId: this.panelId,
      assessmentId: this.assessmentId,
    };

    payload.filterMap = { ...payload.filterMap, ...this.filterMap };
    this.loadData({ ...payload });
  }

  public onStartInterview(data: InterviewByPanel): void {
    const basePath = this.router.url.includes('/admin/')
      ? 'admin/interviews'
      : 'interviewer';
    this.router.navigate([
      `${basePath}/${this.assessmentId}/${data.assessemntRoundId}/${data.id}/${data.email}`,
    ]);
  }

  // Private Methods
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(
      `${INTERVIEW_URL}/InterviewByPanelSummary`,
    );
  }

  private getCurrentRouteId(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.assessmentId = Number(id);
    const panel = this.activatedRoute.snapshot.paramMap.get('panel');
    this.panelId = Number(panel);
  }

  private getPaginatedCandidateData(payload: PaginatedPayload) {
    this.filterMap = {
      ...this.filterMap,
      PanelId: this.panelId,
      assessmentId: this.assessmentId,
    };
    this.interviewService
      .paginationEntity<InterviewByPanel>('InterviewByPanelSummary', {
        ...payload,
        filterMap: this.filterMap,
      })
      .subscribe({
        next: (res: PaginatedData<InterviewByPanel>) => {
          this.data = res;
          this.todayInterviews = [];
          this.previousInterviews = [];
          this.upcomingInterviews = [];
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          res.data.forEach((item: InterviewByPanel) => {
            const interviewDate = new Date(item.interviewDate);
            interviewDate.setHours(0, 0, 0, 0);

            if (interviewDate.getTime() === today.getTime()) {
              this.todayInterviews.push(item);
            } else if (interviewDate < today) {
              this.previousInterviews.push(item);
            } else if (interviewDate > today) {
              (item as any).isDisabledStartInterview = true;
              this.upcomingInterviews.push(item);
            }
          });

          // Transform data to ensure id is always a string for table component
          const transformedData = res.data.map((item) => ({
            ...item,
            id: item.id?.toString() ?? '',
          })) as TableDataItem[];

          this.tableData = {
            ...res,
            data: transformedData,
          };
          this.isInitialLoad = false;
        },
        error: (error: CustomErrorResponse) => {
          this.isInitialLoad = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error : ${error.error?.type || 'Failed to fetch interviews'}`,
          });
        },
      });
  }

  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService
      .getData(payload)
      .subscribe((response: PaginatedData<InterviewByPanel>) => {
        if (response && response.data && Array.isArray(response.data)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          response.data.forEach((item: any) => {
            if (item.interviewDate) {
              const interviewDate = new Date(item.interviewDate);
              interviewDate.setHours(0, 0, 0, 0);
              if (interviewDate > today) {
                item.isDisabledStartInterview = true;
              }
            }
          });
        }
        this.data = response;
        // Also update tableData when loading more data via pagination/search
        const transformedData = response.data.map((item) => ({
          ...item,
          id: item.id?.toString() ?? '',
        })) as TableDataItem[];

        this.tableData = {
          ...response,
          data: transformedData,
        };
      });
  }
}
