import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { GenericDataSource } from '../../../../shared/components/pagination/generic-data-source';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ASSESSMENT_URL } from '../../../../shared/constants/api';
import { KeyValueMap } from '../../../../shared/models/common.models';
import { AssessmentForm } from '../../../admin/models/assessment-form.model';
import { Assessment } from '../../../admin/models/assessment.model';

@Component({
  selector: 'app-interviewer-dashboard',
  imports: [SkeletonComponent, PaginationComponent, AsyncPipe, DatePipe],
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
  public expandedRounds = new Set<number>();

  public onClickAssessment(id: number): void {
    const basePath = this.router.url.includes('/admin/')
      ? 'admin/interviews'
      : 'interviewer';
    if (id > 0) this.router.navigate([`${basePath}/recruitments/${id}`]);
  }

  public getCandidateCount(assessment: any): number {
    return (
      assessment.users?.filter((u: any) => u.role === 'Candidate').length ?? 0
    );
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

  private subscribeToPaginatedData(): void {
    const sub = this.dataSource.connect().subscribe((data) => {
      this.assessmentData = data;
    });
    this.subscriptionList.push(sub);
  }
}
