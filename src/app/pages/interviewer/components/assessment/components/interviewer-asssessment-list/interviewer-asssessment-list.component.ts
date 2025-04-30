import { Component, OnInit } from '@angular/core';
import { GenericDataSource } from '../../../../../../shared/components/pagination/generic-data-source';
import { AssessmentForm } from '../../../../../admin/models/assessment-form.model';
import { ASSESSMENT_URL } from '../../../../../../shared/constants/api';
import { KeyValueMap } from '../../../../../../shared/models/common.models';
import { AssessmentCardComponent } from '../../../../../../shared/components/assessment-card/assessment-card.component';
import { SkeletonComponent } from '../../../../../../shared/components/assessment-card/assessment-card-skeleton';
import { Assessment } from '../../../../../admin/models/assessment.model';
import { BaseComponent } from '../../../../../../shared/components/base/base.component';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-interviewer-asssessment-list',
  imports: [AssessmentCardComponent, SkeletonComponent, PaginationComponent],
  providers: [GenericDataSource],
  templateUrl: './interviewer-asssessment-list.component.html',
  styleUrl: './interviewer-asssessment-list.component.scss',
})
export class InterviewerAsssessmentListComponent
  extends BaseComponent
  implements OnInit
{
  public filterMap!: KeyValueMap<string>;
  public assessmentDataSource: Assessment[] = [];

  constructor(
    public dataSource: GenericDataSource<AssessmentForm>,
    public router: Router,
  ) {
    super();
  }

  ngOnInit(): void {
    this.dataSource.init(`${ASSESSMENT_URL}/AssessmentSummaryInterviewer`);
    this.subscribeToPaginatedData();
  }
  public onClickAssessment(id: number): void {
    if (id > 0) this.router.navigate([`interviewer/assessment/${id}`]);
  }
  private subscribeToPaginatedData(): void {
    const sub = this.dataSource.connect().subscribe((data) => {
      this.assessmentDataSource = data;
    });
    this.subscriptionList.push(sub);
  }
}
