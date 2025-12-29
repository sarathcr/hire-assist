import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';
import { AssessmentCardComponent } from '../../../../shared/components/assessment-card/assessment-card.component';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { GenericDataSource } from '../../../../shared/components/pagination/generic-data-source';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ASSESSMENT_URL } from '../../../../shared/constants/api';
import { KeyValueMap } from '../../../../shared/models/common.models';
import { ConfigMap } from '../../../../shared/utilities/form.utility';
import { AssessmentForm } from '../../../admin/models/assessment-form.model';
import { Assessment } from '../../../admin/models/assessment.model';

@Component({
  selector: 'app-coordinator-dashboard',
  imports: [AssessmentCardComponent, SkeletonComponent, PaginationComponent],
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
  public skeletonCards = [1, 2, 3]; // For rendering 3 skeleton cards

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
  public onClickAssessment(id: number): void {
    if (id > 0) {
      this.router.navigate([`coordinator/recruitments/${id}`]);
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
    const payload = this.dataSource.getPayloadData();
    payload.sortedColumn = {
      active: 'isActive',
      direction: 'desc',
    };

    this.dataSource.connect(payload).subscribe((data) => {
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
    });
    this.subscriptionList.push(sub);
  }
}
