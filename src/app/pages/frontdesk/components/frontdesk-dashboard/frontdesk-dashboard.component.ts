import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { DatePipe, CommonModule } from '@angular/common';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';

import { Assessment } from '../../../admin/models/assessment.model';
import { GenericDataSource } from '../../../../shared/components/pagination/generic-data-source';
import { ASSESSMENT_URL } from '../../../../shared/constants/api';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar/search-bar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state/empty-state.component';
import { KeyValueMap } from '../../../../shared/models/common.models';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-frontdesk-dashboard',
  imports: [SkeletonComponent, PaginationComponent, DatePipe, CommonModule, SearchBarComponent, EmptyStateComponent, MenuModule, ButtonModule, TooltipModule],
  providers: [GenericDataSource],
  templateUrl: './frontdesk-dashboard.component.html',
  styleUrl: './frontdesk-dashboard.component.scss',
})
export class FrontdeskDashboardComponent
  extends BaseComponent
  implements OnInit
{
  public assessmentDataSource: Assessment[] = [];
  public isLoading = true;
  public totalRecords = 0;
  public filterMap: KeyValueMap<string> = {};
  public sortRef: { active: string; direction: 'asc' | 'desc' | '' } = {
    active: 'isActive',
    direction: 'desc',
  };

  @ViewChild(SearchBarComponent) searchBar!: SearchBarComponent;

  public displayMenuItems: MenuItem[] = [];
  public selectedStatus: string = 'All';
  public selectedSortField: string | null = null;
  public selectedSortOrder: 'asc' | 'desc' | '' = '';
  public paginationFirst = 0;

  constructor(
    public router: Router,
    public dataSource: GenericDataSource<Assessment>,
    public messageService: MessageService,
  ) {
    super();
  }
  
  ngOnInit(): void {
    this.dataSource.init(`${ASSESSMENT_URL}/All`);
    
    const dataSub = this.dataSource.connect().subscribe((data) => {
      this.assessmentDataSource = data;
    });

    const totalSub = this.dataSource.totalRecords.subscribe((records) => {
      this.totalRecords = records;
    });

    const loadingSub = this.dataSource.loading$.subscribe((loading) => {
      this.isLoading = loading;
    });

    this.subscriptionList.push(dataSub, totalSub, loadingSub);
    this.updateDisplayMenuItems();
  }

  public expandedRounds = new Set<number>();

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

    const firstNonCompleted = assessment.rounds?.find(
      (r: any) => r.roundStatus?.toLowerCase() !== 'completed'
    );

    if (firstNonCompleted && firstNonCompleted.roundId === round.roundId) {
      return 'recruitment-card__round-chip--in-progress';
    }

    return 'recruitment-card__round-chip--pending';
  }

  public onClickAssessment(id: number): void {
    if (id > 0) {
      this.router.navigate([`frontdesk/recruitments/${id}`]);
    }
  }

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

  public openMenu(event: MouseEvent, menu: any): void {
    menu.toggle(event);
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
    this.sortRef = { active: 'isActive', direction: 'desc' };
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.sortedColumn = this.sortRef;
    this.dataSource.loadPaginatedData(payload);
  }

  public onStatusFilter(status: string | null): void {
    this.selectedStatus = status || 'All';
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const newFilterMap = { ...this.filterMap };
    if (status) {
      newFilterMap['status'] = status;
    } else {
      delete newFilterMap['status'];
    }
    this.filterMap = newFilterMap;

    const payload = this.dataSource.getPayloadData();
    if (payload?.pagination) {
      payload.pagination.pageNumber = 1;
    }
    payload.filterMap = this.filterMap;
    this.dataSource.loadPaginatedData(payload);
  }

  public onResetAll(): void {
    this.selectedStatus = 'All';
    this.selectedSortField = null;
    this.selectedSortOrder = '';
    this.sortRef = { active: 'isActive', direction: 'desc' };
    this.filterMap = {};
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    if (this.searchBar) {
      this.searchBar.clear();
    }

    const payload = this.dataSource.getPayloadData();
    if (payload?.pagination) {
      payload.pagination.pageNumber = 1;
    }
    payload.filterMap = this.filterMap;
    payload.sortedColumn = this.sortRef;
    this.dataSource.loadPaginatedData(payload);
  }

  public hasActiveDisplayModifiers(): boolean {
    return this.hasSearchKey() || (this.selectedStatus && this.selectedStatus !== 'All') || this.selectedSortField !== null;
  }

  public hasSearchKey(): boolean {
    return !!(this.filterMap['searchKey'] && this.filterMap['searchKey'].trim().length > 0);
  }

  public getSortLabel(): string {
    if (!this.selectedSortField) return '';
    const dir = this.selectedSortOrder === 'asc' ? 'A-Z' : 'Z-A';
    if (this.selectedSortField === 'name') {
      return `Name (${dir})`;
    }
    const dirDate = this.selectedSortOrder === 'asc' ? 'Oldest' : 'Newest';
    if (this.selectedSortField === 'startDateTime') {
      return `Start Date (${dirDate})`;
    }
    if (this.selectedSortField === 'endDateTime') {
      return `End Date (${dirDate})`;
    }
    return '';
  }

  public clearSearch(): void {
    if (this.searchBar) {
      this.searchBar.clear();
    }
    this.onSearch('');
  }

  public clearStatusFilter(): void {
    this.onStatusFilter(null);
  }

  public clearSort(): void {
    this.onClearSort();
  }
}
