import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { GenericDataSource } from '../../../../../../../../shared/components/pagination/generic-data-source';
import { PaginatedData, PaginatedPayload } from '../../../../../../../../shared/models/pagination.models';
import { PaginatedDataPayload } from '../../../../../../../../shared/components/pagination/pagination.model';
import { Observable } from 'rxjs';
import { ASSESSMENT_URL } from '../../../../../../../../shared/constants/api';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { PaginationComponent } from '../../../../../../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../../../../../../shared/components/empty-state/empty-state/empty-state.component';
import { TableComponent } from '../../../../../../../../shared/components/table/table.component';
import { FieldType, TableColumnsData } from '../../../../../../../../shared/models/table.models';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { initialPaginatedData } from '../../../../../../../../shared/models/pagination.models';

@Component({
  selector: 'app-previous-recruitment-list',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    PaginationComponent,
    EmptyStateComponent,
    TableComponent,
    SelectButtonModule,
    FormsModule,
    CardModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    SkeletonModule
  ],
  providers: [GenericDataSource],
  templateUrl: './previous-recruitment-list.component.html',
  styleUrl: './previous-recruitment-list.component.scss'
})
export class PreviousRecruitmentListComponent extends BaseComponent implements OnInit {
  public candidateId!: string;
  public recruitmentId!: number;
  public viewMode: 'cards' | 'table' = 'cards';
  public viewOptions = [
    { label: '', value: 'cards', icon: 'pi pi-th-large' },
    { label: '', value: 'table', icon: 'pi pi-list' }
  ];

  public recruitmentDataSource: any[] = [];
  public totalRecords = 0;
  public isLoading$!: Observable<boolean>;

  public tableColumns: TableColumnsData = {
    columns: [
      { field: 'assessmentName', displayName: 'Recruitment Name', sortedColumn: true },
      { field: 'status', displayName: 'Status', sortedColumn: true },
      { field: 'startDateTime', displayName: 'Start Date', fieldType: FieldType.StringToDate, sortedColumn: true },
      { field: 'endDateTime', displayName: 'End Date', fieldType: FieldType.StringToDate, sortedColumn: true }
    ]
  };

  public get tableData(): PaginatedData<any> {
    const payload = this.dataSource.getPayloadData();
    return {
      ...initialPaginatedData,
      data: this.recruitmentDataSource,
      totalRecords: this.totalRecords,
      pageNumber: payload.pagination.pageNumber,
      pageSize: payload.pagination.pageSize,
      succeeded: true
    };
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dataSource: GenericDataSource<any>,
    private assessmentService: AssessmentService
  ) {
    super();
    this.isLoading$ = this.dataSource.loading$;
  }

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    this.candidateId = params.get('candidateId') || '';
    this.recruitmentId = Number(params.get('recruitmentId') || 0);
    
    if (this.candidateId) {
      this.dataSource.init(`${ASSESSMENT_URL}/candidates/previous/${this.candidateId}`);
      this.subscribeToPaginatedData();
      
      // Trigger initial load explicitly to show skeleton
      this.dataSource.loadPaginatedData({
        sortedColumn: { active: '', direction: '' },
        filterMap: {},
        pagination: { pageNumber: 1, pageSize: 8 }
      });
    }

    // Also subscribe to changes in case the route changes while on the same component
    this.route.paramMap.subscribe(params => {
      const newId = params.get('candidateId') || '';
      if (newId && newId !== this.candidateId) {
        this.candidateId = newId;
        this.recruitmentId = Number(params.get('recruitmentId') || 0);
        this.dataSource.init(`${ASSESSMENT_URL}/candidates/previous/${this.candidateId}`);
        // Only trigger manual load if the component is already initialized and the ID changed
        this.dataSource.loadPaginatedData({
          sortedColumn: { active: '', direction: '' },
          filterMap: {},
          pagination: { pageNumber: 1, pageSize: 5 }
        });
      }
    });
  }

  private subscribeToPaginatedData(): void {
    const sub = this.dataSource.connect().subscribe(data => {
      this.recruitmentDataSource = data || [];
    });
    this.subscriptionList.push(sub);

    const totalSub = this.dataSource.totalRecords.subscribe(total => {
      this.totalRecords = total;
    });
    this.subscriptionList.push(totalSub);
  }

  public onCardClick(recruitment: any): void {
    const recruitmentId = recruitment.assessmentId || recruitment.id;
    this.router.navigate([`admin/recruitments/candidateDetail/${recruitmentId}/${this.candidateId}`], {
      queryParams: { 
        lastCompletedRoundId: recruitment.lastCompletedRoundId 
      }
    });
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    const dataPayload: PaginatedDataPayload = {
      sortedColumn: payload.multiSortedColumns[0] || { active: '', direction: '' },
      filterMap: payload.filterMap as any,
      pagination: payload.pagination
    };
    this.dataSource.loadPaginatedData(dataPayload);
  }

  public navigateBack(): void {
    this.router.navigate([`admin/recruitments/schedule/${this.recruitmentId}`]);
  }

  public getStatusSeverity(status: string): any {
    switch (status?.toLowerCase()) {
      case 'selected': return 'success';
      case 'rejected': return 'danger';
      case 'in-progress': return 'info';
      case 'completed': return 'success';
      default: return 'warn';
    }
  }
}
