import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AssessmentCardComponent } from '../../../../../../shared/components/assessment-card/assessment-card.component';
import { BaseComponent } from '../../../../../../shared/components/base/base.component';
import { GenericDataSource } from '../../../../../../shared/components/pagination/generic-data-source';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination.component';
import { ASSESSMENT_URL } from '../../../../../../shared/constants/api';
import { KeyValueMap } from '../../../../../../shared/models/common.models';
import { AssessmentForm } from '../../../../models/assessment-form.model';
import { Assessment } from '../../../../models/assessment.model';
import { SkeletonComponent } from '../../../../../../shared/components/assessment-card/assessment-card-skeleton';

@Component({
  selector: 'app-assessment-summary',
  imports: [AssessmentCardComponent, PaginationComponent, SkeletonComponent, AsyncPipe],
  providers: [GenericDataSource],
  templateUrl: './assessment-summary.component.html',
  styleUrl: './assessment-summary.component.scss',
})
export class AssessmentSummaryComponent
  extends BaseComponent
  implements OnInit
{
  public filterMap!: KeyValueMap<string>;
  public assessmentDataSource: Assessment[] = [];
  public totalRecords = 0;
  public isInitialLoad = true;
  public isLoading = false;
  public isLoading$!: Observable<boolean>;

  constructor(
    public dataSource: GenericDataSource<AssessmentForm>,
    public router: Router,
  ) {
    super();
    this.isLoading$ = this.dataSource.loading$;
  }

  // Life Cycle Hooks
  ngOnInit(): void {
    this.dataSource.init(`${ASSESSMENT_URL}/AssessmentSummaryInterviewer`);
    this.subscribeToPaginatedData();
    const sub = this.dataSource.totalRecords$.subscribe((records) => {
      this.totalRecords = records;
    });
    this.subscriptionList.push(sub);
  }

  // Public Methods
  public onClickAssessment(id: number, panel: number): void {
    if (id > 0) this.router.navigate([`admin/interviews/${id}/${panel}`]);
  }

  // Private Methods
  private subscribeToPaginatedData(): void {
    let hasReceivedData = false;

    const sub = this.dataSource.connect().subscribe((data) => {
      this.assessmentDataSource = data;
      hasReceivedData = true;
      // Set isLoading to false when data arrives
      this.isLoading = false;
    });
    this.subscriptionList.push(sub);

    // Track loading state to set isInitialLoad to false when loading completes
    const loadingSub = this.dataSource.loading$.subscribe((isLoading) => {
      // Update isLoading based on dataSource loading state
      this.isLoading = isLoading;
      // Set isInitialLoad to false when loading completes AND we have received data
      if (!isLoading && this.isInitialLoad && hasReceivedData) {
        this.isInitialLoad = false;
      }
    });
    this.subscriptionList.push(loadingSub);
  }
}
