import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { GenericDataSource } from '../../../../shared/components/pagination/generic-data-source';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ASSESSMENT_URL } from '../../../../shared/constants/api';
import { KeyValueMap } from '../../../../shared/models/common.models';
import { AssessmentForm } from '../../../admin/models/assessment-form.model';
import { Assessment } from '../../../admin/models/assessment.model';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar/search-bar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state/empty-state.component';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-interviewer-dashboard',
  imports: [
    SkeletonComponent,
    PaginationComponent,
    AsyncPipe,
    DatePipe,
    SearchBarComponent,
    EmptyStateComponent,
    MenuModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './interviewer-dashboard.component.html',
  styleUrl: './interviewer-dashboard.component.scss',
  providers: [GenericDataSource],
})
export class InterviewerDashboardComponent
  extends BaseComponent
  implements OnInit
{
  public assessmentData!: Assessment[];
  public totalRecords = 0;
  public filterMap: KeyValueMap<string> = {};
  public hasLoaded = false;
  private initialized = false;

  @ViewChild(SearchBarComponent) searchBar!: SearchBarComponent;

  public displayMenuItems: MenuItem[] = [];
  public selectedStatus: string = 'All';
  public selectedSortField: string | null = null;
  public selectedSortOrder: 'asc' | 'desc' | '' = '';
  public sortRef: { active: string; direction: 'asc' | 'desc' | '' } = { active: '', direction: '' };
  public paginationFirst = 0;

  constructor(
    public dataSource: GenericDataSource<AssessmentForm>,
    private router: Router,
  ) {
    super();
  }

  // Life Cycle Hooks
  ngOnInit(): void {
    this.dataSource.init(`${ASSESSMENT_URL}/AssessmentSummaryInterviewer`);
    this.subscribeToPaginatedData();
    const sub = this.dataSource.totalRecords$.subscribe((records) => {
      this.totalRecords = records;
    });
    this.subscriptionList.push(sub);
    
    this.dataSource.loading$.subscribe((isLoading) => {
      if (isLoading) {
        this.initialized = true;
      } else if (this.initialized) {
        this.hasLoaded = true;
      }
    });

    this.updateDisplayMenuItems();
  }

  // Public Methods
  public expandedRounds = new Set<number>();

  public onSearch(searchTerm: string): void {
    const newFilterMap = { ...this.filterMap };

    if (searchTerm && searchTerm.trim().length > 0) {
      newFilterMap['searchKey'] = searchTerm.trim();
    } else {
      delete newFilterMap['searchKey'];
    }

    this.filterMap = newFilterMap;
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    if (payload?.pagination) {
      payload.pagination.pageNumber = 1;
    }
    payload.filterMap = this.filterMap;
    this.dataSource.loadPaginatedData(payload);
  }

  private updateDisplayMenuItems(): void {
    const getFilterStyleClass = (status: string | null) => {
      const current = this.selectedStatus || 'All';
      const target = status || 'All';
      return current === target ? 'active-filter-item' : '';
    };
    const getSortStyleClass = (field: string, direction: 'asc' | 'desc') => 
      (this.selectedSortField === field && this.selectedSortOrder === direction) ? 'active-filter-item' : '';

    this.displayMenuItems = [
      {
        label: 'Sort By',
        items: [
          { label: 'Default (Unsorted)', icon: 'pi pi-sort-alt', styleClass: this.selectedSortField === null ? 'active-filter-item' : '', command: () => this.onClearSort() },
          { label: 'Name (A-Z)', icon: 'pi pi-sort-alpha-down', styleClass: getSortStyleClass('name', 'asc'), command: () => this.onSort('name', 'asc') },
          { label: 'Name (Z-A)', icon: 'pi pi-sort-alpha-up', styleClass: getSortStyleClass('name', 'desc'), command: () => this.onSort('name', 'desc') },
          { label: 'Start Date (Newest)', icon: 'pi pi-calendar-minus', styleClass: getSortStyleClass('startDateTime', 'desc'), command: () => this.onSort('startDateTime', 'desc') },
          { label: 'Start Date (Oldest)', icon: 'pi pi-calendar-plus', styleClass: getSortStyleClass('startDateTime', 'asc'), command: () => this.onSort('startDateTime', 'asc') },
          { label: 'End Date (Newest)', icon: 'pi pi-calendar-minus', styleClass: getSortStyleClass('endDateTime', 'desc'), command: () => this.onSort('endDateTime', 'desc') },
          { label: 'End Date (Oldest)', icon: 'pi pi-calendar-plus', styleClass: getSortStyleClass('endDateTime', 'asc'), command: () => this.onSort('endDateTime', 'asc') }
        ]
      },
      {
        label: 'Filter Status',
        items: [
          { label: 'Default (All)', icon: 'pi pi-list', styleClass: getFilterStyleClass(null), command: () => this.onStatusFilter(null) },
          { label: 'Active', icon: 'pi pi-play', styleClass: getFilterStyleClass('Active'), command: () => this.onStatusFilter('Active') },
          { label: 'Inactive', icon: 'pi pi-pause', styleClass: getFilterStyleClass('Inactive'), command: () => this.onStatusFilter('Inactive') },
          { label: 'Completed', icon: 'pi pi-check-circle', styleClass: getFilterStyleClass('Completed'), command: () => this.onStatusFilter('Completed') }
        ]
      },
      {
        label: 'Actions',
        items: [
          { label: 'Reset All', icon: 'pi pi-refresh', disabled: !this.hasActiveDisplayModifiers(), command: () => this.onResetAll() }
        ]
      }
    ];
  }

  public onSort(field: string, direction: 'asc' | 'desc'): void {
    this.selectedSortField = field;
    this.selectedSortOrder = direction;
    this.sortRef = { active: field, direction: direction };
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.sortedColumn = this.sortRef;
    this.dataSource.loadPaginatedData(payload);
  }

  public onClearSort(): void {
    this.selectedSortField = null;
    this.selectedSortOrder = '';
    this.sortRef = { active: '', direction: '' };
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.sortedColumn = this.sortRef;
    this.dataSource.loadPaginatedData(payload);
  }

  public openMenu(event: Event, menu: any): void {
    event.stopPropagation();
    menu.toggle(event);
  }

  public onStatusFilter(status: string | null): void {
    const finalStatus = status || 'All';
    this.selectedStatus = finalStatus;
    const newFilterMap = { ...(this.filterMap || {}) };

    if (finalStatus !== 'All') {
      newFilterMap['status'] = finalStatus;
    } else {
      delete newFilterMap['status'];
    }

    this.filterMap = newFilterMap;
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.filterMap = this.filterMap;
    this.dataSource.loadPaginatedData(payload);
  }

  public hasActiveDisplayModifiers(): boolean {
    return !!(this.hasSearchKey() || (this.selectedStatus && this.selectedStatus !== 'All') || this.selectedSortField);
  }

  public hasSearchKey(): boolean {
    return !!(this.filterMap['searchKey'] && this.filterMap['searchKey'].trim().length > 0);
  }

  public getSortLabel(): string {
    if (!this.selectedSortField) return '';
    const direction = this.selectedSortOrder === 'asc' ? 'A-Z' : 'Z-A';
    const dateDir = this.selectedSortOrder === 'asc' ? 'Oldest' : 'Newest';
    if (this.selectedSortField === 'name') return `Name (${direction})`;
    if (this.selectedSortField === 'startDateTime') return `Start Date (${dateDir})`;
    if (this.selectedSortField === 'endDateTime') return `End Date (${dateDir})`;
    return `${this.selectedSortField}`;
  }

  public clearSearch(): void {
    if (this.searchBar) {
      this.searchBar.clear();
    }
    const newFilterMap = { ...this.filterMap };
    delete newFilterMap['searchKey'];
    this.filterMap = newFilterMap;
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.filterMap = this.filterMap;
    this.dataSource.loadPaginatedData(payload);
  }

  public clearStatusFilter(): void {
    this.onStatusFilter(null);
  }

  public clearSort(): void {
    this.onClearSort();
  }

  public onResetAll(): void {
    this.selectedStatus = 'All';
    this.selectedSortField = null;
    this.selectedSortOrder = '';
    this.sortRef = { active: '', direction: '' };
    this.filterMap = {};
    this.paginationFirst = 0;

    if (this.searchBar) {
      this.searchBar.clear();
    }
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.filterMap = this.filterMap;
    payload.sortedColumn = this.sortRef;
    this.dataSource.loadPaginatedData(payload);
  }

  public onClickAssessment(id: number): void {
    const basePath = this.router.url.includes('/admin/')
      ? 'admin/interviews'
      : 'interviewer';
    if (id > 0) this.router.navigate([`${basePath}/recruitments/${id}`]);
  }

  public getCandidateCount(assessment: any): number {
    const localCount =
      assessment.users?.filter((u: any) => u.role === 'Candidate').length ?? 0;
    return localCount === 0 && assessment.candidateCount != null
      ? assessment.candidateCount
      : localCount;
  }

  public toggleRounds(event: Event, id: number): void {
    event.stopPropagation();
    if (this.expandedRounds.has(id)) {
      this.expandedRounds.delete(id);
    } else {
      this.expandedRounds.add(id);
    }
  }

  public getRoundStatusClass(assessment: any, round: any): string {
    const status = round.roundStatus?.toLowerCase();
    if (status === 'completed') {
      return 'recruitment-card__round-chip--completed';
    }

    // The "Current" round is the first one that isn't completed
    const firstNonCompleted = assessment.rounds?.find(
      (r: any) => r.roundStatus?.toLowerCase() !== 'completed'
    );

    if (firstNonCompleted && firstNonCompleted.roundId === round.roundId) {
      return 'recruitment-card__round-chip--in-progress';
    }

    return 'recruitment-card__round-chip--pending';
  }

  public get isMobileOrTablet(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 1024;
  }

  private subscribeToPaginatedData(): void {
    const sub = this.dataSource.connect().subscribe((data) => {
      this.assessmentData = data;
    });
    this.subscriptionList.push(sub);
  }
}
