import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { ErrorResponse } from '../../../../shared/models/custom-error.models';
import { ConfigMap } from '../../../../shared/utilities/form.utility';
import { CoordinatorAssessmentRounds } from '../../../admin/models/assessment.model';
import { AssessmentService } from '../../../admin/services/assessment.service';

import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-coordinator-assessment',
  imports: [SkeletonComponent, DatePipe, CommonModule],
  templateUrl: './coordinator-assessment.component.html',
  styleUrl: './coordinator-assessment.component.scss',
})
export class CoordinatorAssessmentComponent
  extends BaseComponent
  implements OnInit
{
  public assessmentRoundDataSource: CoordinatorAssessmentRounds[] = [];
  public assessmentId!: number;
  public configMap!: ConfigMap;
  public isLoading = false;
  public skeletonCards = [1, 2, 3]; // For rendering 3 skeleton cards

  constructor(
    public router: Router,
    private activatedRoute: ActivatedRoute,
    private assessmentService: AssessmentService,
  ) {
    super();
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    const routeId =
      this.activatedRoute.snapshot.paramMap.get('recruitmentId') ||
      this.activatedRoute.snapshot.paramMap.get('id');

    if (routeId) {
      this.assessmentId = Number(routeId);
      this.getDetails();
    }
  }

  // Public Methods
  public isRoundCompleted(round: CoordinatorAssessmentRounds | any): boolean {
    if (!round) return false;
    const status = (round.status || '').toString().trim().toLowerCase();
    const roundStatus = (round.roundStatus || '').toString().trim().toLowerCase();
    const statusId = round.statusId != null ? Number(round.statusId) : null;

    return (
      status === 'completed' ||
      status.includes('completed') ||
      roundStatus === 'completed' ||
      roundStatus.includes('completed') ||
      statusId === 3 ||
      statusId === 7 ||
      round.isCompleted === true ||
      round.roundCompleted === true
    );
  }

  public isRoundActive(round: CoordinatorAssessmentRounds | any): boolean {
    if (!round) return false;
    if (this.isRoundCompleted(round)) return false;

    const status = (round.status || '').toString().trim().toLowerCase();
    const roundStatus = (round.roundStatus || '').toString().trim().toLowerCase();
    const statusId = round.statusId != null ? Number(round.statusId) : null;

    return (
      round.isActive === true ||
      status === 'active' ||
      roundStatus === 'active' ||
      statusId === 1
    );
  }

  public isRoundPending(round: CoordinatorAssessmentRounds | any): boolean {
    if (!round) return false;
    if (this.isRoundCompleted(round) || this.isRoundActive(round)) return false;

    const status = (round.status || '').toString().trim().toLowerCase();
    const roundStatus = (round.roundStatus || '').toString().trim().toLowerCase();
    const statusId = round.statusId != null ? Number(round.statusId) : null;

    return (
      status === 'pending' ||
      roundStatus === 'pending' ||
      statusId === 2
    );
  }

  public onClickAssessment(assessmentRoundId: number): void {
    if (assessmentRoundId > 0) {
      if (this.router.url.includes('/admin/coordinator')) {
        this.router.navigate([
          `admin/coordinator/${this.assessmentId}/${assessmentRoundId}`,
        ]);
      } else {
        this.router.navigate([
          `coordinator/recruitments/${this.assessmentId}/${assessmentRoundId}`,
        ]);
      }
    }
  }

  // Private Methods
  private getDetails(): void {
    this.isLoading = true;
    const next = (res: CoordinatorAssessmentRounds[]) => {
      this.assessmentRoundDataSource = res;
      this.isLoading = false;
    };
    const error = (error: ErrorResponse) => {
      this.isLoading = false;
    };
    this.assessmentService
      .getAssessmentRoundByAssessmentIdCoordinator(this.assessmentId)
      .subscribe({ next, error });
  }
}
