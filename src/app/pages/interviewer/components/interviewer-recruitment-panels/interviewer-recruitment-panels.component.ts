import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccordionModule, AccordionTabOpenEvent } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { TableDataSourceService } from '../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { TableSkeletonComponent } from '../../../../shared/components/table/table.skeleton';
import { INTERVIEW_URL } from '../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../shared/models/custom-error.models';
import {
  PaginatedData,
  PaginatedPayload,
} from '../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../shared/models/table.models';
import {
  InterviewByPanel,
  InterviewerPanelDetails,
} from '../../../admin/models/assessment-schedule.model';
import { InterviewService } from '../../../admin/services/interview.service';
import { InterviewerPanelsSkeletonComponent } from './interviewer-recruitment-panels-skeleton.component';

const panelTableColumns: TableColumnsData = {
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
      displayName: 'Round',
      sortedColumn: true,
      hasChip: false,
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

/** Groups all response rows by panelId so each panel only appears once. */
function groupByPanel(
  rows: InterviewerPanelDetails[],
): { panelId: number; panelName: string; roundName: string }[] {
  const panelMap = new Map<
    number,
    { panelId: number; panelName: string; roundNames: Set<string> }
  >();

  for (const row of rows) {
    if (!panelMap.has(row.panelId)) {
      panelMap.set(row.panelId, {
        panelId: row.panelId,
        panelName: row.panelName,
        roundNames: new Set([row.roundName]),
      });
    } else {
      const panel = panelMap.get(row.panelId);
      if (panel && row.roundName) {
        panel.roundNames.add(row.roundName);
      }
    }
  }

  return Array.from(panelMap.values()).map((p) => ({
    panelId: p.panelId,
    panelName: p.panelName,
    roundName: Array.from(p.roundNames).filter(Boolean).sort().join(' / '),
  }));
}

@Component({
  selector: 'app-interviewer-recruitment-panels',
  imports: [
    CommonModule,
    AccordionModule,
    TableComponent,
    ChipModule,
    BadgeModule,
    InterviewerPanelsSkeletonComponent,
    TableSkeletonComponent,
  ],
  providers: [TableDataSourceService],
  templateUrl: './interviewer-recruitment-panels.component.html',
  styleUrl: './interviewer-recruitment-panels.component.scss',
})
export class InterviewerRecruitmentPanelsComponent implements OnInit {
  public assessmentId!: number;
  public isLoading = true;

  /** Deduplicated list of panels assigned to this interviewer */
  public panels: { panelId: number; panelName: string; roundName: string }[] =
    [];

  /** Raw rows — used to compute per-panel metadata chips */
  public panelDetails: InterviewerPanelDetails[] = [];

  /** Paginated candidate table data keyed by panelId */
  public candidatesByPanel: Record<string, PaginatedData<TableDataItem>> = {};

  /** Loading state per panel key */
  public loadingPanels: Record<string, boolean> = {};

  public columns: TableColumnsData = panelTableColumns;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly interviewService: InterviewService,
    private readonly messageService: MessageService,
    private readonly dataSourceService: TableDataSourceService<InterviewByPanel>,
  ) {}

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.dataSourceService.setEndpoint(
      `${INTERVIEW_URL}/InterviewByPanelSummary`,
    );
    this.route.paramMap.subscribe((params) => {
      this.assessmentId = Number(params.get('id'));
      if (this.assessmentId) {
        this.loadPanels();
      }
    });
  }

  // ─── Public Methods ──────────────────────────────────────────────────────────

  /** Called when a panel header is clicked/expanded. */
  public onPanelHeaderClick(panelId: number): void {
    if (panelId != null && !this.candidatesByPanel[panelId]) {
      this.loadCandidatesForPanel(new PaginatedPayload(), panelId);
    }
  }

  /** Called when a panel accordion is opened via PrimeNG event. */
  public onAccordionOpen(event: AccordionTabOpenEvent): void {
    let panelId: number | undefined;
    if ((event as any).value != null) {
      panelId = Number((event as any).value);
    } else if (event.index != null) {
      panelId = this.panels[event.index]?.panelId;
    }
    if (panelId != null) {
      this.onPanelHeaderClick(panelId);
    }
  }

  /** Called when the table's pagination / sort / filter changes. */
  public onTablePayloadChange(
    payload: PaginatedPayload,
    panelId: number,
  ): void {
    payload.filterMap = {
      ...payload.filterMap,
      PanelId: panelId,
      assessmentId: this.assessmentId,
    };
    this.loadingPanels[panelId] = true;
    this.dataSourceService.getData(payload).subscribe({
      next: (res: PaginatedData<InterviewByPanel>) => {
        this.candidatesByPanel[panelId] = {
          ...res,
          data: res.data.map((item) => ({
            ...item,
            id: item.id?.toString() ?? '',
          })) as TableDataItem[],
        };
        this.loadingPanels[panelId] = false;
      },
      error: () => {
        this.loadingPanels[panelId] = false;
      },
    });
  }

  /** Navigate to the feedback/interview page. */
  public onStartInterview(data: InterviewByPanel, panelId: number): void {
    const basePath = this.router.url.includes('/admin/')
      ? 'admin/interviews'
      : 'interviewer';
    this.router.navigate([
      `${basePath}/${this.assessmentId}/${data.assessemntRoundId}/${data.id}/${data.email}`,
    ]);
  }

  /** Returns all rows for a given panelId (used for metadata chips). */
  public getRowsForPanel(panelId: number): InterviewerPanelDetails[] {
    return this.panelDetails.filter((r) => r.panelId === panelId);
  }

  /** Count candidates with a specific status in a panel. */
  public countByStatus(panelId: number, status: string): number {
    return this.getRowsForPanel(panelId).filter((r) =>
      r.status?.toLowerCase().includes(status.toLowerCase()),
    ).length;
  }

  /** Total candidates assigned to a panel. */
  public totalForPanel(panelId: number): number {
    return this.getRowsForPanel(panelId).length;
  }

  // ─── Private Methods ─────────────────────────────────────────────────────────

  private loadPanels(): void {
    this.isLoading = true;
    this.interviewService.getInterviewerPanels(this.assessmentId).subscribe({
      next: (res: InterviewerPanelDetails[]) => {
        this.panelDetails = res ?? [];
        this.panels = groupByPanel(this.panelDetails);
        this.isLoading = false;
      },
      error: (err: CustomErrorResponse) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.type ?? 'Failed to load panels.',
        });
      },
    });
  }

  private loadCandidatesForPanel(
    payload: PaginatedPayload,
    panelId: number,
  ): void {
    this.loadingPanels[panelId] = true;
    payload.filterMap = {
      PanelId: panelId,
      assessmentId: this.assessmentId,
    };
    this.interviewService
      .paginationEntity<InterviewByPanel>('InterviewByPanelSummary', payload)
      .subscribe({
        next: (res: PaginatedData<InterviewByPanel>) => {
          this.candidatesByPanel[panelId] = {
            ...res,
            data: res.data.map((item) => ({
              ...item,
              id: item.id?.toString() ?? '',
            })) as TableDataItem[],
          };
          this.loadingPanels[panelId] = false;
        },
        error: (err: CustomErrorResponse) => {
          this.loadingPanels[panelId] = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.type ?? 'Failed to load candidates.',
          });
        },
      });
  }
}
