import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  imports: [AssessmentCardComponent, PaginationComponent, SkeletonComponent],
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
  public isLoading = false;

  constructor(
    public dataSource: GenericDataSource<AssessmentForm>,
    public router: Router,
  ) {
    super();
  }

  // Life Cycle Hooks
  ngOnInit(): void {
    this.isLoading = true;
    this.dataSource.init(`${ASSESSMENT_URL}/AssessmentSummaryInterviewer`);
    this.subscribeToPaginatedData();
    const sub = this.dataSource.totalRecords$.subscribe((records) => {
      this.totalRecords = records;
      this.isLoading = false;
    });
    this.subscriptionList.push(sub);
  }

  // Public Methods
  public onClickAssessment(id: number, panel: number): void {
    if (id > 0) this.router.navigate([`admin/interviews/${id}/${panel}`]);
  }

  // Private Methods
  private subscribeToPaginatedData(): void {
    this.isLoading = true;
    const sub = this.dataSource.connect().subscribe((data) => {
      this.assessmentDataSource = data;
      this.isLoading = false;
    });
    this.subscriptionList.push(sub);
  }
}
