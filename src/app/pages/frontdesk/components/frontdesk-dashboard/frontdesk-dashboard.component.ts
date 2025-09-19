import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BaseComponent } from 'primeng/basecomponent';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';
import { AssessmentCardComponent } from '../../../../shared/components/assessment-card/assessment-card.component';
import { CustomErrorResponse } from '../../../../shared/models/custom-error.models';
import { Assessment } from '../../../admin/models/assessment.model';
import { AssessmentService } from '../../../admin/services/assessment.service';

@Component({
  selector: 'app-frontdesk-dashboard',
  imports: [SkeletonComponent, AssessmentCardComponent],
  templateUrl: './frontdesk-dashboard.component.html',
  styleUrl: './frontdesk-dashboard.component.scss',
})
export class FrontdeskDashboardComponent
  extends BaseComponent
  implements OnInit
{
  public assessmentDataSource: Assessment[] = [];

  constructor(
    public router: Router,
    public assessmentService: AssessmentService,
    public messageService: MessageService,
  ) {
    super();
  }
  override ngOnInit(): void {
    this.getAllAssessments();
  }

  public onClickAssessment(id: number): void {
    if (id > 0) {
      this.router.navigate([`frontdesk/recruitments/${id}`]);
    }
  }

  private getAllAssessments(): void {
    const next = (res: Assessment[]) => {
      this.assessmentDataSource = res;
    };

    const error = (error: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error.type,
      });
    };

    this.assessmentService
      .getAssessmentsForFrontDesk()
      .subscribe({ next, error });
  }
}
