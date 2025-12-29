import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';
import { AssessmentCardComponent } from '../../../../shared/components/assessment-card/assessment-card.component';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { ErrorResponse } from '../../../../shared/models/custom-error.models';
import { ConfigMap } from '../../../../shared/utilities/form.utility';
import { CoordinatorAssessmentRounds } from '../../../admin/models/assessment.model';
import { AssessmentService } from '../../../admin/services/assessment.service';

@Component({
  selector: 'app-coordinator-assessment',
  imports: [AssessmentCardComponent, SkeletonComponent],
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
    const routeId = this.activatedRoute.snapshot.paramMap.get('id');

    if (routeId) {
      this.assessmentId = Number(routeId);
      this.getDetails();
    }
  }

  // Public Methods
  public onClickAssessment(assessmentRoundId: number): void {
    if (assessmentRoundId > 0) {
      this.router.navigate([
        `coordinator/recruitments/${this.assessmentId}/${assessmentRoundId}`,
      ]);
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
