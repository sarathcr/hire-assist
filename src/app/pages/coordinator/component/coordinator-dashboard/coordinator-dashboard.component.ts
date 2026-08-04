import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';
import { DatePipe, CommonModule } from '@angular/common';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { GenericDataSource } from '../../../../shared/components/pagination/generic-data-source';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ASSESSMENT_URL } from '../../../../shared/constants/api';
import { KeyValueMap } from '../../../../shared/models/common.models';
import { ConfigMap } from '../../../../shared/utilities/form.utility';
import { AssessmentForm } from '../../../admin/models/assessment-form.model';
import { Assessment } from '../../../admin/models/assessment.model';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar/search-bar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state/empty-state.component';

@Component({
  selector: 'app-coordinator-dashboard',
  imports: [SkeletonComponent, PaginationComponent, DatePipe, CommonModule, SearchBarComponent, EmptyStateComponent],
  providers: [GenericDataSource],
  templateUrl: './coordinator-dashboard.component.html',
  styleUrl: './coordinator-dashboard.component.scss',
})
export class CoordinatorDashboardComponent
  extends BaseComponent
  implements OnInit
{
  public assessmentDataSource: Assessment[] = [];
  public configMap!: ConfigMap;
  public totalRecords = 0;
  public filterMap!: KeyValueMap<string>;
  public isLoading = false;
  public hasLoaded = false;
  private initialized = false;
  public skeletonCards = [1, 2, 3]; // For rendering 3 skeleton cards
  public sortRef: { active: string; direction: 'asc' | 'desc' } = {
    active: 'isActive',
    direction: 'desc',
  };

  constructor(
    public router: Router,
    public dataSource: GenericDataSource<AssessmentForm>,
  ) {
    super();
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.setConfigMaps();
    this.subscribeToPaginatedData();
    this.subscribeToLoadingState();
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

    const payload = this.dataSource.getPayloadData();
    if (payload?.pagination) {
      payload.pagination.pageNumber = 1;
    }
    payload.filterMap = this.filterMap;
    this.dataSource.loadPaginatedData(payload);
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
      if (this.router.url.includes('/admin/coordinator')) {
        this.router.navigate([`admin/coordinator/${id}`]);
      } else {
        this.router.navigate([`coordinator/recruitments/${id}`]);
      }
    }
  }

  // Private Methods
  private setPaginationEndpoint() {
    this.dataSource.init(`${ASSESSMENT_URL}/AssessmentSummaryCoordinator`);
  }

  private setConfigMaps(): void {
    const { metadata } = new AssessmentForm();
    this.configMap = metadata.configMap || {};
  }
  private subscribeToPaginatedData() {
    this.dataSource.connect().subscribe((data) => {
      this.assessmentDataSource = data;
    });

    const sub = this.dataSource.totalRecords.subscribe((records) => {
      this.totalRecords = records;
    });

    this.subscriptionList.push(sub);
  }

  private subscribeToLoadingState() {
    const sub = this.dataSource.loading$.subscribe((loading) => {
      this.isLoading = loading;
      if (loading) {
        this.initialized = true;
      } else if (this.initialized) {
        this.hasLoaded = true;
      }
    });
    this.subscriptionList.push(sub);
  }
}
