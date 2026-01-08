import { Component, OnInit } from '@angular/core';
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
import { TabPanel, TabPanels, Tab, TabList, Tabs } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';

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
      field: 'actions',
      displayName: '',
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
    TabPanel,
    TabPanels,
    Tab,
    TabList,
    Tabs,
    CardModule,
    BadgeModule,
  ],
  providers: [TableDataSourceService],
  templateUrl: './interviewer-candidate-list.component.html',
  styleUrl: './interviewer-candidate-list.component.scss',
})
export class InterviewerCandidateListComponent implements OnInit {
  public data!: PaginatedData<InterviewByPanel>;
  public columns: TableColumnsData = tableColumns;

  private assessmentId!: number;
  private panelId!: number;
  public filterMap!: FilterMap;
  public todayInterviews: InterviewByPanel[] = [];
  public previousInterviews: InterviewByPanel[] = [];
  public upcomingInterviews: InterviewByPanel[] = [];
  public todayTableData: PaginatedData<TableDataItem> = {
    pageNumber: 1,
    pageSize: 5,
    totalPages: 0,
    totalRecords: 0,
    data: [],
    succeeded: true,
    errors: [],
    message: '',
  };
  public PreviousTableData: PaginatedData<TableDataItem> = {
    pageNumber: 1,
    pageSize: 5,
    totalPages: 0,
    totalRecords: 0,
    data: [],
    succeeded: true,
    errors: [],
    message: '',
  };
  public upComingTableData: PaginatedData<TableDataItem> = {
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
    this.router.navigate([`interviewer/${this.assessmentId}/${data.email}`]);
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    const today = new Date().toISOString().split('T')[0];

    this.filterMap = {
      ...this.filterMap,
      PanelId: this.panelId,
      date: today,
      assessmentId: this.assessmentId,
    };

    payload.filterMap = { ...payload.filterMap, ...this.filterMap };
    this.loadData({ ...payload });
  }

  public onStartInterview(data: InterviewByPanel): void {
    this.router.navigate([
      `interviewer/${this.assessmentId}/${data.assessemntRoundId}/${data.id}/${data.email}`,
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
      .paginationEntity<InterviewByPanel>('/InterviewByPanelSummary', {
        ...payload,
        filterMap: this.filterMap,
      })
      .subscribe({
        next: (res: PaginatedData<InterviewByPanel>) => {
          this.todayInterviews = [];
          this.previousInterviews = [];
          this.upcomingInterviews = [];
          this.data = res;
          this.todayInterviews = [];
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          this.data.data.forEach((item: InterviewByPanel) => {
            const interviewDate = new Date(item.interviewDate);
            interviewDate.setHours(0, 0, 0, 0);

            if (interviewDate.getTime() === today.getTime()) {
              this.todayInterviews.push(item);
            } else if (interviewDate < today) {
              this.previousInterviews.push(item);
            } else if (interviewDate > today) {
              this.upcomingInterviews.push(item);
            }
          });
          // Transform data to ensure id is always a string for table component
          const transformForTable = (
            items: InterviewByPanel[],
          ): TableDataItem[] => {
            return items.map((item) => ({
              ...item,
              id: item.id?.toString() ?? '',
            })) as TableDataItem[];
          };

          this.todayTableData = {
            pageNumber: 1,
            pageSize: 5,
            totalPages: 1,
            totalRecords: 5,
            data: transformForTable(this.todayInterviews ?? []),
            succeeded: true,
            errors: [],
            message: '',
          };
          this.PreviousTableData = {
            pageNumber: 1,
            pageSize: 5,
            totalPages: 1,
            totalRecords: 5,
            data: transformForTable(this.previousInterviews ?? []),
            succeeded: true,
            errors: [],
            message: '',
          };
          this.upComingTableData = {
            pageNumber: 1,
            pageSize: 5,
            totalPages: 1,
            totalRecords: 5,
            data: transformForTable(this.upcomingInterviews ?? []),
            succeeded: true,
            errors: [],
            message: '',
          };
        },
        error: (error: CustomErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error : ${error.error.type}`,
          });
        },
      });
  }

  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService
      .getData(payload)
      .subscribe((response: PaginatedData<InterviewByPanel>) => {
        this.data = response;
      });
  }
}
