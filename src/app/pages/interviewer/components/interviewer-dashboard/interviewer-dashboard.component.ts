import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';
import { AssessmentCardComponent } from '../../../../shared/components/assessment-card/assessment-card.component';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { GenericDataSource } from '../../../../shared/components/pagination/generic-data-source';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ASSESSMENT_URL } from '../../../../shared/constants/api';
import { KeyValueMap } from '../../../../shared/models/common.models';
import { AssessmentForm } from '../../../admin/models/assessment-form.model';
import { Assessment } from '../../../admin/models/assessment.model';

@Component({
  selector: 'app-interviewer-dashboard',
  imports: [AssessmentCardComponent, SkeletonComponent, PaginationComponent, AsyncPipe],
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
  public filterMap!: KeyValueMap<string>;
  public hasLoaded = false;
  private initialized = false;

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
  }

  // Public Methods
  public onClickAssessment(id: number, panel: number): void {
    if (id > 0) this.router.navigate([`interviewer/${id}/${panel}`]);
  }

  private subscribeToPaginatedData(): void {
    const sub = this.dataSource.connect().subscribe((data) => {
      this.assessmentData = data;
    });
    this.subscriptionList.push(sub);
  }
}
