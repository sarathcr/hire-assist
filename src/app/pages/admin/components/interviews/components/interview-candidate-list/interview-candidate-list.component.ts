/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { HistoryDrawerComponent } from '../../../../../../shared/components/history-drawer/history-drawer.component';
import { INTERVIEW_URL } from '../../../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import {
  FilterMap,
  PaginatedPayload,
} from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { InterviewByPanel } from '../../../../models/assessment-schedule.model';
import { InterviewService } from '../../../../services/interview.service';
import { TabPanel, TabPanels, Tab, TabList, Tabs } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { finalize } from 'rxjs/operators';
import { StatusEnum } from '../../../../../../shared/enums/status.enum';
import { AssessmentService } from '../../../../services/assessment.service';
import { CoordinatorPanelBridgeService } from '../../../../../coordinator/services/coordinator-panel-bridge.service';
import { PanelService } from '../../../../services/panel.service';
import { Assessment } from '../../../../models/assessment.model';
import { PanelSummary } from '../../../../models/assessment-schedule.model';
import { Panel } from '../../../../models/panel.model';

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
      field: 'button',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      buttonIcons: ['pi pi-play', 'pi pi-history'],
      buttonLabels: ['Start Interview', 'History'],
      buttonTooltips: ['Start Interview', 'History'],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: [],
};

@Component({
  selector: 'app-interview-candidate-list',
  imports: [
    TableComponent,
    HistoryDrawerComponent,
    TabPanel,
    TabPanels,
    Tab,
    TabList,
    Tabs,
    CardModule,
    BadgeModule,
  ],
  providers: [TableDataSourceService],
  templateUrl: './interview-candidate-list.component.html',
  styleUrl: './interview-candidate-list.component.scss',
})
export class InterviewCandidateListComponent implements OnInit {
  public data!: any;
  public columns: TableColumnsData = tableColumns;

  private assessmentId!: number;
  private panelId!: number;
  public filterMap!: FilterMap;
  public todayInterviews: any[] = [];
  public previousInterviews: any[] = [];
  public upcomingInterviews: any[] = [];
  public todayTableData!: any;
  public PreviousTableData!: any;
  public upComingTableData!: any;
  public isLoading = false;
  public assessmentName = '';
  public panelName = '';
  public visible: boolean = false;
  public events: any[] = [];
  public historyLoading: boolean = false;
  public historyPagination = {
    pageNumber: 1,
    pageSize: 10,
    totalRecords: 0
  };
  public currentHistoryInterviewId: string | null = null;

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

  constructor(
    private readonly interviewService: InterviewService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly messageService: MessageService,
    private readonly dataSourceService: TableDataSourceService<InterviewByPanel>,
    private readonly assessmentService: AssessmentService,
    private readonly coordinatorPanelBridgeService: CoordinatorPanelBridgeService,
    private readonly panelService: PanelService,
  ) {}

  // Lifecycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getCurrentRouteId();
    this.loadAssessmentDetails();
    this.loadPanelDetails();
    this.getPaginatedCandidateData(new PaginatedPayload());
  }

  private loadAssessmentDetails(): void {
    if (this.assessmentId) {
      this.assessmentService.getEntityById(this.assessmentId).subscribe({
        next: (assessment: Assessment) => {
          this.assessmentName = assessment.name || 'Assessment';
        },
        error: () => {
          this.assessmentName = 'Assessment';
        },
      });
    }
  }

  private loadPanelDetails(): void {
    if (this.panelId) {
      // Try to get panel by ID using PanelService
      this.panelService.getEntityById(this.panelId).subscribe({
        next: (panel: Panel) => {
          this.panelName = panel.name || 'Panel';
        },
        error: () => {
          // Fallback: try to get from activePanelSummary
          this.loadPanelFromActiveSummary();
        },
      });
    }
  }

  private loadPanelFromActiveSummary(): void {
    if (this.panelId) {
      const payload = {
        multiSortedColumns: [],
        filterMap: {},
        pagination: { pageNumber: 1, pageSize: 100 },
      };
      this.coordinatorPanelBridgeService
        .paginationEntity<PanelSummary>('panel/activePanelSummary', payload)
        .subscribe({
          next: (res: any) => {
            if (res.data && res.data.length > 0) {
              // Find the panel with matching ID
              const panel = res.data.find((p: PanelSummary) => String(p.id) === String(this.panelId));
              if (panel) {
                this.panelName = panel.panelName || 'Panel';
              } else {
                this.panelName = 'Panel';
              }
            } else {
              this.panelName = 'Panel';
            }
          },
          error: () => {
            this.panelName = 'Panel';
          },
        });
    }
  }

  // Public Methods
  public onButtonClick(data: { event: any; fName: string }): void {
    const { event, fName } = data;
    switch (fName) {
      case 'Start Interview':
        this.onStartInterview(event);
        break;
      case 'History':
        this.viewHistory(event.id);
        break;
      default:
        break;
    }
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
      `admin/interviews/${this.assessmentId}/${data.assessemntRoundId}/${data.id}/${data.email}`,
    ]);
  }

  public viewHistory(id: any) {
    this.currentHistoryInterviewId = String(id);
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
      interviewId: this.currentHistoryInterviewId || ''
    };

    payload.multiSortedColumns = [{ active: 'ChangedAt', direction: 'desc' }];

    this.interviewService.getInterviewHistory(payload)
      .pipe(finalize(() => this.historyLoading = false))
      .subscribe({
        next: (res: any) => {
          const newEvents = res.data.map((item: any) => ({
            status: this.formatAction(item.action),
            user: item.changedByName,
            date: new Date(item.changedAt + 'Z'),
            icon: this.getHistoryIcon(item.action),
            description: this.getHistoryDescription(item)
          }));
          this.events = [...this.events, ...newEvents];
          this.historyPagination.totalRecords = res.totalRecords;
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch history.'
          });
        }
      });
  }

  private formatAction(action: string): string {
    if (!action) return '';
    return action
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private getStatusLabel(statusId: any): string {
    if (!statusId) return '';
    const id = Number(statusId);
    return StatusEnum[id] || statusId;
  }

  private getHistoryDescription(item: any): string {
    if (item.details) {
      return item.details;
    }
    if (item.field?.toLowerCase() === 'statusid') {
      const prev = this.getStatusLabel(item.previousValue);
      const curr = this.getStatusLabel(item.currentValue);
      if (curr === 'Selected') {
        return `Candidate status updated as Selected`;
      }
      return `Status: ${prev || 'None'} → ${curr || 'None'}`;
    }
    if (item.field) {
      return `${item.field}: ${item.previousValue || 'None'} → ${item.currentValue || 'None'}`;
    }
    return 'Candidate was modified';
  }

  private getHistoryIcon(action: string): string {
    switch (action?.toLowerCase()) {
      case 'created':
        return 'pi pi-plus';
      case 'scheduled':
        return 'pi pi-calendar-clock';
      case 'panelassigned':
        return 'pi pi-users';
      case 'statusupdated':
        return 'pi pi-sync';
      default:
        return 'pi pi-info-circle';
    }
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
    this.isLoading = true;
    this.filterMap = {
      ...this.filterMap,
      PanelId: this.panelId,

      assessmentId: this.assessmentId,
    };
    this.interviewService
      .paginationEntity('InterviewByPanelSummary', {
        ...payload,
        filterMap: this.filterMap,
      })
      .subscribe({
        next: (res) => {
          // Initialize arrays
          this.todayInterviews = [];
          this.previousInterviews = [];
          this.upcomingInterviews = [];
          this.data = res;
          
          // Process data if available
          if (res && res.data && Array.isArray(res.data)) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            res.data.forEach((item: any) => {
              if (item.interviewDate) {
                const interviewDate = new Date(item.interviewDate);
                interviewDate.setHours(0, 0, 0, 0);

                if (interviewDate.getTime() === today.getTime()) {
                  this.todayInterviews.push(item);
                } else if (interviewDate < today) {
                  this.previousInterviews.push(item);
                } else if (interviewDate > today) {
                  item.disabledButtonIndices = [0];
                  this.upcomingInterviews.push(item);
                }
              }
            });
          }
          this.todayTableData = {
            pageNumber: 1,
            pageSize: 5,
            totalPages: 1,
            totalRecords: this.todayInterviews?.length || 0,
            data: this.todayInterviews ?? [],
            succeeded: true,
            errors: [],
            message: '',
          };
          this.PreviousTableData = {
            pageNumber: 1,
            pageSize: 5,
            totalPages: 1,
            totalRecords: this.previousInterviews?.length || 0,
            data: this.previousInterviews ?? [],
            succeeded: true,
            errors: [],
            message: '',
          };
          this.upComingTableData = {
            pageNumber: 1,
            pageSize: 5,
            totalPages: 1,
            totalRecords: this.upcomingInterviews?.length || 0,
            data: this.upcomingInterviews ?? [],
            succeeded: true,
            errors: [],
            message: '',
          };
          this.isLoading = false;
        },
        error: (error: CustomErrorResponse) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error : ${error.error.type}`,
          });
        },
      });
  }

  private loadData(payload: PaginatedPayload): void {
    this.isLoading = true;
    this.dataSourceService
      .getData(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((response: any) => {
        if (response && response.data && Array.isArray(response.data)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          response.data.forEach((item: any) => {
            if (item.interviewDate) {
              const interviewDate = new Date(item.interviewDate);
              interviewDate.setHours(0, 0, 0, 0);
              if (interviewDate > today) {
                item.disabledButtonIndices = [0];
              }
            }
          });
        }
        this.data = {
          ...response,
          status: response.status,
        };
      });
  }
}
