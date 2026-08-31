import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { GenericDataSource } from '../../../../../../../../shared/components/pagination/generic-data-source';
import { PaginatedData, PaginatedPayload } from '../../../../../../../../shared/models/pagination.models';
import { PaginatedDataPayload } from '../../../../../../../../shared/components/pagination/pagination.model';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
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
    SkeletonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule
  ],
  providers: [GenericDataSource],
  templateUrl: './previous-recruitment-list.component.html',
  styleUrl: './previous-recruitment-list.component.scss'
})
export class PreviousRecruitmentListComponent extends BaseComponent implements OnInit {
  public candidateId!: string;
  public recruitmentId!: number;
  public viewMode: 'cards' | 'table' = 'cards';
  public searchKey = '';
  private searchSubject = new Subject<string>();
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

  public tableData: PaginatedData<any> = { ...initialPaginatedData };

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
      this.dataSource.init(`${ASSESSMENT_URL}/candidates/previous`);
      this.subscribeToPaginatedData();
      
      this.dataSource.loadPaginatedData({
        sortedColumn: { active: '', direction: '' },
        filterMap: { candidateId: this.candidateId },
        pagination: { pageNumber: 1, pageSize: 5 }
      });
    }

    // Also subscribe to changes in case the route changes while on the same component
    this.route.paramMap.subscribe(params => {
      const newId = params.get('candidateId') || '';
      if (newId && newId !== this.candidateId) {
        this.candidateId = newId;
        this.recruitmentId = Number(params.get('recruitmentId') || 0);
        this.dataSource.init(`${ASSESSMENT_URL}/candidates/previous`);
        // Only trigger manual load if the component is already initialized and the ID changed
        this.dataSource.loadPaginatedData({
          sortedColumn: { active: '', direction: '' },
          filterMap: { candidateId: this.candidateId },
          pagination: { pageNumber: 1, pageSize: 5 }
        });
      }
    });

    this.subscriptionList.push(
      this.searchSubject.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(searchTerm => {
        if (searchTerm === this.searchKey) {
          this.applyFilters();
        }
      })
    );
  }

  private subscribeToPaginatedData(): void {
    const sub = this.dataSource.connect().subscribe(data => {
      this.recruitmentDataSource = data || [];
      this.updateTableDataObject();
    });
    this.subscriptionList.push(sub);

    const totalSub = this.dataSource.totalRecords.subscribe(total => {
      this.totalRecords = total;
      this.updateTableDataObject();
    });
    this.subscriptionList.push(totalSub);
  }

  private updateTableDataObject(): void {
    const payload = this.dataSource.getPayloadData();
    this.tableData = {
      ...initialPaginatedData,
      data: this.recruitmentDataSource,
      totalRecords: this.totalRecords,
      pageNumber: payload.pagination?.pageNumber || 1,
      pageSize: payload.pagination?.pageSize || 5,
      succeeded: true
    };
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
      filterMap: { ...payload.filterMap as any, candidateId: this.candidateId },
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

  public onSearch(event: any): void {
    this.searchKey = event.target.value ?? '';
    this.searchSubject.next(this.searchKey);
  }

  public clearSearch(): void {
    this.searchKey = '';
    this.searchSubject.next('');
    this.applyFilters();
  }

  private applyFilters(): void {
    const currentPayload = this.dataSource.getPayloadData();
    const filterMap = { 
      ...currentPayload.filterMap, 
      candidateId: this.candidateId,
      searchKey: this.searchKey 
    };
    
    if (!this.searchKey) {
      delete (filterMap as any).searchKey;
    }

    const dataPayload: PaginatedDataPayload = {
      sortedColumn: currentPayload.sortedColumn,
      filterMap: filterMap as any,
      pagination: {
        pageNumber: 1,
        pageSize: currentPayload.pagination.pageSize
      }
    };
    this.dataSource.loadPaginatedData(dataPayload);
  }
}
