import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BaseComponent } from 'primeng/basecomponent';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';
import { AssessmentCardComponent } from '../../../../shared/components/assessment-card/assessment-card.component';
import { CustomErrorResponse } from '../../../../shared/models/custom-error.models';
import { Assessment } from '../../../admin/models/assessment.model';
import { AssessmentService } from '../../../admin/services/assessment.service';

@Component({
  selector: 'app-frontdesk-assessment-rounds',
  imports: [AssessmentCardComponent, SkeletonComponent],
  templateUrl: './frontdesk-assessment-rounds.component.html',
  styleUrl: './frontdesk-assessment-rounds.component.scss',
})
export class FrontdeskAssessmentRoundsComponent
  extends BaseComponent
  implements OnInit
{
  public assessmentDataSource: Assessment[] = [];
  public assessmentId!: number;
  public isLoading = true;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private assessmentService: AssessmentService,
    private messageService: MessageService,
  ) {
    super();
  }
  override ngOnInit(): void {
    this.getAssessmentId();
    this.getAllAssessmentRounds();
  }

  public onClickAssessment(id: number): void {
    if (id > 0) {
      this.router.navigate([
        `frontdesk/recruitments/${this.assessmentId}/round/${id}`,
      ]);
    }
  }

  private getAssessmentId() {
    this.route.paramMap.subscribe((params) => {
      this.assessmentId = params.get('id')! as unknown as number;
    });
  }

  private getAllAssessmentRounds(): void {
    const next = (res: Assessment[]) => {
      this.assessmentDataSource = res;
      this.isLoading = false;
    };

    const error = (error: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error.type,
      });
      this.isLoading = false;
    };

    this.assessmentService
      .getAssessmentRoundsForFrontDesk(this.assessmentId)
      .subscribe({ next, error });
  }
}
