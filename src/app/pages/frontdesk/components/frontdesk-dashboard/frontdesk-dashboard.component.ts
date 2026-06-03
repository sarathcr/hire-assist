import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
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

@Component({
  selector: 'app-frontdesk-dashboard',
  imports: [SkeletonComponent, PaginationComponent, DatePipe, CommonModule, SearchBarComponent, EmptyStateComponent],
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

    const payload = this.dataSource.getPayloadData();
    if (payload?.pagination) {
      payload.pagination.pageNumber = 1;
    }
    payload.filterMap = this.filterMap;
    this.dataSource.loadPaginatedData(payload);
  }
}
